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

        $userText = $system . "\n\nREPORT PAYLOAD:\n" . json_encode($payload, JSON_UNESCAPED_SLASHES);

        $body = [
            "contents" => [
                [
                    "role" => "user",
                    "parts" => [
                        ["text" => $userText]
                    ],
                ],
            ],
            "generationConfig" => [
                "temperature" => 0.4,
                "topP" => 0.9,
                "maxOutputTokens" => 2048,
                "responseMimeType" => "application/json",
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

        $parsed = json_decode($text, true);
        if (!is_array($parsed)) {
            $jsonOnly = $this->extractJsonObject($text);
            $parsed = $jsonOnly ? json_decode($jsonOnly, true) : null;
        }

        if (!is_array($parsed)) {
            return ['ok' => false, 'error' => 'Gemini output was not valid JSON', 'raw' => $text];
        }

        // ensure exact keys exist
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
                $parsed[$k] = in_array($k, ["suggestedReviewerComment","completeness","confidence"]) ? "" : [];
            }
        }

        // normalize types
        foreach (["missingSections","missingMetadata","consistencyIssues","wordingIssues","riskFlags","topIssues"] as $arrKey) {
            if (!is_array($parsed[$arrKey])) $parsed[$arrKey] = [];
        }
        foreach (["completeness","suggestedReviewerComment","confidence"] as $strKey) {
            if (!is_string($parsed[$strKey])) $parsed[$strKey] = (string) $parsed[$strKey];
        }

        // normalize confidence
        $c = strtolower(trim($parsed["confidence"]));
        if (!in_array($c, ["low","medium","high"])) $c = "medium";
        $parsed["confidence"] = $c;

        return ['ok' => true, 'review' => $parsed];
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
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        return trim($text);
    }
}
