<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiDashboardAnalysisService
{
    public function analyze(array $payload): array
    {
        $apiKey  = config('gemini.api_key');
        $baseUrl = config('gemini.base_url');
        $timeout = (int) config('gemini.request_timeout', 60);
        $model   = config('gemini.model', 'gemini-2.5-flash');

        if (!$apiKey) {
            return ['ok' => false, 'error' => 'GEMINI_API_KEY is missing in .env'];
        }

        $system = <<<SYS
You are an analytics assistant for a Pressure Vessel Inspection reporting system.

GOAL:
Analyze dashboard data and produce useful management insights for inspectors/reviewers/admins.

STRICT RULES:
- Use ONLY the provided data. Do not invent counts, dates, IDs, or facts.
- If data is missing, say "insufficient data".
- Output MUST be valid JSON only, no markdown.

Return JSON with exactly these keys:
summary, keyInsights, risks, recommendations, suggestedNextActions

Where:
- summary: short paragraph string
- keyInsights: array of bullet strings
- risks: array of bullet strings (e.g., workload risk, backlog risk)
- recommendations: array of bullet strings
- suggestedNextActions: array of objects with keys: title, reason
SYS;

        $userText = $system . "\n\nDashboard data:\n" . json_encode($payload, JSON_UNESCAPED_SLASHES);

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

        // Ensure keys exist
        $keys = ["summary","keyInsights","risks","recommendations","suggestedNextActions"];
        foreach ($keys as $k) {
            if (!array_key_exists($k, $parsed)) {
                $parsed[$k] = in_array($k, ['keyInsights','risks','recommendations']) ? [] : ($k === 'suggestedNextActions' ? [] : "");
            }
        }

        return ['ok' => true, 'analysis' => $parsed];
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
