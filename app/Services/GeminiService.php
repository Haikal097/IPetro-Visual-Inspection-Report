<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GeminiService
{
    public function generateText(string $prompt): string
    {
        $apiKey = config('gemini.api_key');
        $model = config('gemini.model');
        $baseUrl = rtrim(config('gemini.base_url'), '/');
        $timeout = config('gemini.timeout', 60);

        if (!$apiKey) {
            throw new \RuntimeException('GEMINI_API_KEY is missing in .env');
        }

        $url = "{$baseUrl}/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt]
                    ],
                ],
            ],
            // Optional safety / generation controls
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 1024,
            ],
        ];

        $res = Http::timeout($timeout)
            ->acceptJson()
            ->asJson()
            ->post($url, $payload);

        if (!$res->successful()) {
            $msg = $res->json('error.message') ?? $res->body();
            throw new \RuntimeException("Gemini API error: {$msg}");
        }

        // Extract model text output
        $text = $res->json('candidates.0.content.parts.0.text');

        return is_string($text) && Str::length($text) ? $text : 'No response from AI.';
    }
}
