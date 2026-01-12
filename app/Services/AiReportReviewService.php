<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiReportReviewService
{
    public function analyze(array $payload): array
    {
        $apiKey  = config('gemini.api_key');
        $baseUrl = config('gemini.base_url') ?: 'https://generativelanguage.googleapis.com';
        $timeout = (int) config('gemini.request_timeout', 60);
        $model   = config('gemini.model', 'gemini-2.5-flash');

        if (!$apiKey) {
            return ['ok' => false, 'error' => 'GEMINI_API_KEY is missing in .env'];
        }

        $system = <<<SYS
You are an "AI Review Assistant" for a pressure vessel inspection report (DOSH-style).
Your job is to help the human reviewer spot issues. The final decision (approve/reject/revision) is ALWAYS made by the reviewer.

STRICT RULES:
- Do NOT invent values (thickness, pressure, NDT readings, dates, cert numbers, clauses).
- Only analyze what is provided.
- Be specific, actionable.
- If a section is empty/missing, flag it.
- IGNORE photos/images. Do not analyze photo_report_items images. Only check PV report sections + metadata.

OUTPUT:
Return ONLY valid JSON with EXACTLY these keys:
completeness, missingSections, missingMetadata, consistencyIssues, wordingIssues, riskFlags, topIssues, suggestedReviewerComment, confidence

KEY EXPECTATIONS:
- completeness: short paragraph summary
- missingSections: array of strings
- missingMetadata: array of strings
- consistencyIssues: array of strings
- wordingIssues: array of strings
- riskFlags: array of strings
- topIssues: array of strings (max 3)
- suggestedReviewerComment: string (a ready-to-paste comment for revision request)
- confidence: one of ["low","medium","high"] based only on completeness + consistency (NOT truth)
SYS;

        // Keep payload smaller & safer (optional, but helps avoid truncation)
        // Remove photo items to ensure it doesn't "talk about photos"
        if (isset($payload['report_data']['items'])) unset($payload['report_data']['items']);
        if (isset($payload['items'])) unset($payload['items']);
        if (isset($payload['photo_report_items'])) unset($payload['photo_report_items']);
        if (isset($payload['photo_reports'])) unset($payload['photo_reports']);

        $userText = $system . "\n\nREPORT PAYLOAD:\n" . json_encode($payload, JSON_UNESCAPED_SLASHES);

        // ✅ Gemini response schema (forces JSON shape)
        $schema = [
            "type" => "OBJECT",
            "properties" => [
                "completeness" => ["type" => "STRING"],
                "missingSections" => ["type" => "ARRAY", "items" => ["type" => "STRING"]],
                "missingMetadata" => ["type" => "ARRAY", "items" => ["type" => "STRING"]],
                "consistencyIssues" => ["type" => "ARRAY", "items" => ["type" => "STRING"]],
                "wordingIssues" => ["type" => "ARRAY", "items" => ["type" => "STRING"]],
                "riskFlags" => ["type" => "ARRAY", "items" => ["type" => "STRING"]],
                "topIssues" => ["type" => "ARRAY", "items" => ["type" => "STRING"]],
                "suggestedReviewerComment" => ["type" => "STRING"],
                "confidence" => ["type" => "STRING", "enum" => ["low", "medium", "high"]],
            ],
            "required" => [
                "completeness",
                "missingSections",
                "missingMetadata",
                "consistencyIssues",
                "wordingIssues",
                "riskFlags",
                "topIssues",
                "suggestedReviewerComment",
                "confidence",
            ],
        ];

        // 1) First attempt
        $text = $this->callGemini($baseUrl, $model, $apiKey, $timeout, $userText, $schema);
        if (!$text['ok']) return $text;

        $raw = $text['text'];

        $parsed = $this->tryParseJson($raw);

        // 2) If invalid JSON, do a "repair" retry (very effective)
        if (!is_array($parsed)) {
            $repairPrompt = <<<FIX
You must output ONLY VALID JSON and nothing else.
Fix the following content into valid JSON that matches the required schema.
Do NOT add any commentary.

CONTENT:
{$raw}
FIX;

            $retry = $this->callGemini($baseUrl, $model, $apiKey, $timeout, $repairPrompt, $schema);
            if (!$retry['ok']) return $retry;

            $raw2 = $retry['text'];
            $parsed = $this->tryParseJson($raw2);

            if (!is_array($parsed)) {
                return ['ok' => false, 'error' => 'Gemini output was not valid JSON', 'raw' => $raw2];
            }
        }

        // ensure exact keys exist + normalize types
        $keys = [
            "completeness",
            "missingSections",
            "missingMetadata",
            "consistencyIssues",
            "wordingIssues",
            "riskFlags",
            "topIssues",
            "suggestedReviewerComment",
            "confidence",
        ];

        foreach ($keys as $k) {
            if (!array_key_exists($k, $parsed)) {
                $parsed[$k] = in_array($k, ["suggestedReviewerComment", "completeness", "confidence"]) ? "" : [];
            }
        }

        foreach (["missingSections","missingMetadata","consistencyIssues","wordingIssues","riskFlags","topIssues"] as $arrKey) {
            if (!is_array($parsed[$arrKey])) $parsed[$arrKey] = [];
        }
        foreach (["completeness","suggestedReviewerComment","confidence"] as $strKey) {
            if (!is_string($parsed[$strKey])) $parsed[$strKey] = (string) $parsed[$strKey];
        }

        $c = strtolower(trim($parsed["confidence"]));
        if (!in_array($c, ["low","medium","high"])) $c = "medium";
        $parsed["confidence"] = $c;

        return ['ok' => true, 'review' => $parsed];
    }

    private function callGemini(string $baseUrl, string $model, string $apiKey, int $timeout, string $prompt, array $schema): array
    {
        $body = [
            "contents" => [
                [
                    "role" => "user",
                    "parts" => [
                        ["text" => $prompt]
                    ],
                ],
            ],
            "generationConfig" => [
                "temperature" => 0.2,
                "topP" => 0.9,
                "maxOutputTokens" => 4096,
                "responseMimeType" => "application/json",
                "responseSchema" => $schema,
            ],
        ];

        $url = rtrim($baseUrl, '/') . "/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $res = Http::timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post($url, $body);

        if (!$res->ok()) {
            return [
                'ok' => false,
                'error' => "Gemini request failed: HTTP " . $res->status(),
                'details' => $res->json(),
            ];
        }

        $text = $this->extractGeminiText($res->json());
        if (!$text) return ['ok' => false, 'error' => 'Gemini returned no text'];

        $text = $this->stripCodeFences($text);

        return ['ok' => true, 'text' => $text];
    }

    private function tryParseJson(string $text): ?array
    {
        $text = $this->stripCodeFences($text);

        $parsed = json_decode($text, true);
        if (is_array($parsed)) return $parsed;

        $jsonOnly = $this->extractJsonObject($text);
        if ($jsonOnly) {
            $parsed2 = json_decode($jsonOnly, true);
            if (is_array($parsed2)) return $parsed2;
        }

        return null;
    }

    private function extractGeminiText(array $response): ?string
    {
        $candidates = $response['candidates'] ?? null;
        if (!is_array($candidates) || empty($candidates)) return null;

        $parts = $candidates[0]['content']['parts'] ?? null;
        if (!is_array($parts) || empty($parts)) return null;

        $text = '';
        foreach ($parts as $p) {
            if (isset($p['text'])) $text .= $p['text'];
        }

        return trim($text) ?: null;
    }

    private function extractJsonObject(string $text): ?string
    {
        $start = strpos($text, '{');
        $end   = strrpos($text, '}');
        if ($start === false || $end === false || $end <= $start) return null;
        return substr($text, $start, $end - $start + 1);
    }

    private function stripCodeFences(string $text): string
    {
        $text = trim($text);

        // remove ```json ... ``` or ``` ... ```
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);

        // sometimes Gemini adds leading "json" line
        $text = preg_replace('/^\s*json\s*/i', '', $text);

        return trim($text);
    }
}
