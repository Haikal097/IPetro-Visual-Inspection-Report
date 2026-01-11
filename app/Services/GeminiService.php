<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiService
{
    public function generateText(string $prompt): string
    {
        $apiKey  = config('gemini.api_key') ?: env('AIzaSyBYxuqYvqn_FTzGK4wHF_6cQKlcRqRMJVY');
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
}
