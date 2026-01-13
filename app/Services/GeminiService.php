<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiService
{
    public function generateText(string $prompt): string
    {
        // ✅ FIX (required): your line was incomplete and caused syntax error
        $apiKey  = config('gemini.api_key') ?: env('GEMINI_API_KEY');

        $model   = config('gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.5-flash');
        $baseUrl = config('gemini.base_url') ?: env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com');
        $timeout = (int) (config('gemini.request_timeout') ?: env('GEMINI_TIMEOUT', 60));

        if (!$apiKey) {
            throw new RuntimeException('GEMINI_API_KEY is missing in .env');
        }

        $url = rtrim($baseUrl, '/') . "/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 1024,
            ],
        ];

        $res = Http::timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post($url, $payload);

        if (!$res->ok()) {
            $status = $res->status();
            $raw = $res->body();

            // try to read a helpful message if response is JSON
            $json = null;
            try { $json = $res->json(); } catch (\Throwable $e) {}

            $msg =
                (is_array($json) ? ($json['error']['message'] ?? $json['message'] ?? null) : null)
                ?: $raw
                ?: '(empty response body)';

            throw new RuntimeException("Gemini API error (HTTP {$status}): {$msg}");
        }

        $json = $res->json();
        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!is_string($text) || trim($text) === '') {
            return 'No response from AI.';
        }

        return trim($text);
    }

    // ====================== AI RISK EXPLANATION (ADD ONLY) ======================

    /**
     * Explain why a report is risky based on your computed risk score + reasons/stats.
     * Returns:
     * - why (string)
     * - confidence (low|medium|high)
     * - recommendation (approve|request_revision|reject)
     * - model
     * - error (nullable)
     */
    public function explainRisk(array $payload): array
    {
        $apiKey  = config('gemini.api_key') ?: env('GEMINI_API_KEY');
        $model   = config('gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.5-flash');
        $baseUrl = config('gemini.base_url') ?: env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com');
        $timeout = (int) (config('gemini.request_timeout') ?: env('GEMINI_TIMEOUT', 60));

        if (!$apiKey) {
            return [
                'why' => null,
                'confidence' => null,
                'recommendation' => null,
                'model' => $model,
                'error' => 'Missing GEMINI_API_KEY',
            ];
        }

        $url = rtrim($baseUrl, '/') . "/v1beta/models/{$model}:generateContent?key={$apiKey}";
        $prompt = $this->buildRiskPrompt($payload);

        $reqPayload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                // keep it stable + short
                'temperature' => 0.2,
                'maxOutputTokens' => 300,
            ],
        ];

        $res = Http::timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post($url, $reqPayload);

        if (!$res->ok()) {
            $status = $res->status();
            $raw = $res->body();

            $json = null;
            try { $json = $res->json(); } catch (\Throwable $e) {}

            $msg =
                (is_array($json) ? ($json['error']['message'] ?? $json['message'] ?? null) : null)
                ?: $raw
                ?: '(empty response body)';

            return [
                'why' => null,
                'confidence' => null,
                'recommendation' => null,
                'model' => $model,
                'error' => "Gemini API error (HTTP {$status}): {$msg}",
            ];
        }

        $json = $res->json();
        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;

        $parsed = $this->tryParseJson($text);

        return [
            'why' => $parsed['why'] ?? (is_string($text) ? trim($text) : null),
            'confidence' => $parsed['confidence'] ?? null,
            'recommendation' => $parsed['recommendation'] ?? null,
            'model' => $model,
            'error' => null,
        ];
    }

    // ✅ ADD ONLY
    private function buildRiskPrompt(array $p): string
    {
        $title = (string)($p['report_title'] ?? 'Report');
        $score = (int)($p['score'] ?? 0);
        $level = (string)($p['level'] ?? 'Low');
        $reasons = $p['reasons'] ?? [];
        $stats = $p['stats'] ?? [];

        return
"You are an assistant helping a reviewer evaluate inspection reports.

Given the risk score and signals, produce a concise explanation and a suggested reviewer action.

Return STRICT JSON only (no markdown, no extra text), with keys:
- why (string, 1-2 sentences, grounded in reasons/stats)
- confidence (low|medium|high)
- recommendation (approve|request_revision|reject)

Context:
Title: {$title}
RiskScore: {$score} ({$level})
Reasons: " . json_encode($reasons) . "
Stats: " . json_encode($stats) . "

Be concise. Do not invent facts not in Reasons/Stats.";
    }

    // ✅ ADD ONLY
    private function tryParseJson($text): array
    {
        if (!is_string($text)) return [];
        $text = trim($text);

        // Try to extract JSON if model returns extra text
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start !== false && $end !== false && $end > $start) {
            $maybe = substr($text, $start, $end - $start + 1);
            $decoded = json_decode($maybe, true);
            if (is_array($decoded)) return $decoded;
        }

        $decoded = json_decode($text, true);
        return is_array($decoded) ? $decoded : [];
    }

    // ====================== END AI RISK EXPLANATION ======================
}
