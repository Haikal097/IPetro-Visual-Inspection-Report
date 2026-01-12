<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiInspectorChatService
{
    public function chat(array $messages, array $context = []): array
    {
        $apiKey  = config('gemini.api_key');
        $baseUrl = config('gemini.base_url') ?: 'https://generativelanguage.googleapis.com';
        $timeout = (int) config('gemini.request_timeout', 60);
        $model   = config('gemini.model', 'gemini-2.5-flash');

        if (!$apiKey) {
            return ['ok' => false, 'error' => 'GEMINI_API_KEY is missing in .env'];
        }

        $system = <<<SYS
You are an assistant for a Pressure Vessel inspector.

RULES:
- Be practical, short, and step-by-step.
- Never invent values (thickness, pressure, NDT readings, certificate numbers).
- If user asks for something not provided, ask for required details.
- You may reference the provided context.
SYS;

        // Convert messages from frontend into Gemini contents
        // Expected $messages: [{role: 'user'|'assistant', content: '...'}]
        $contents = [];

        // Provide context as the first user message (safe)
        if (!empty($context)) {
            $contents[] = [
                "role" => "user",
                "parts" => [[
                    "text" => $system . "\n\nContext:\n" . json_encode($context, JSON_UNESCAPED_SLASHES)
                ]]
            ];
        } else {
            $contents[] = [
                "role" => "user",
                "parts" => [[ "text" => $system ]]
            ];
        }

        foreach ($messages as $m) {
            $role = ($m['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
            $text = (string) ($m['content'] ?? '');

            if (trim($text) === '') continue;

            $contents[] = [
                "role" => $role,
                "parts" => [[ "text" => $text ]]
            ];
        }

        $body = [
            "contents" => $contents,
            "generationConfig" => [
                "temperature" => 0.6,
                "topP" => 0.9,
                "maxOutputTokens" => 1024,
            ],
        ];

        $url = rtrim($baseUrl, '/') . "/v1beta/models/{$model}:generateContent?key={$apiKey}";

        // ✅ IMPORTANT FIX: Retry on 503 overload (Gemini busy)
        $res = $this->postGeminiWithRetry($url, $body, $timeout);
        if (($res['ok'] ?? false) !== true) return $res;

        $text = $this->extractGeminiText($res['json'] ?? []);
        if (!$text) return ['ok' => false, 'error' => 'Gemini returned no text'];

        return ['ok' => true, 'reply' => $text];
    }

    public function suggestTitle(array $messages, array $context = []): array
    {
        $apiKey  = config('gemini.api_key');
        $baseUrl = config('gemini.base_url') ?: 'https://generativelanguage.googleapis.com';
        $timeout = (int) config('gemini.request_timeout', 60);
        $model   = config('gemini.model', 'gemini-2.5-flash');

        if (!$apiKey) {
            return ['ok' => false, 'error' => 'GEMINI_API_KEY is missing in .env'];
        }

        // ✅ take LAST messages so topic is accurate
        $slice = array_slice($messages, -6);

        $system = <<<SYS
You generate a short chat session title.
Rules:
- 3 to 6 words only
- No quotes, no emojis
- Title must reflect the main topic discussed
- Use Title Case
Return ONLY plain text title (no JSON, no labels).
SYS;

        $userText = $system . "\n\nConversation:\n" . json_encode($slice, JSON_UNESCAPED_SLASHES);

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
                "temperature" => 0.2,
                "topP" => 0.9,
                "maxOutputTokens" => 40,
            ],
        ];

        $url = rtrim($baseUrl, '/') . "/v1beta/models/{$model}:generateContent?key={$apiKey}";

        // ✅ IMPORTANT FIX: Retry on 503 overload
        $res = $this->postGeminiWithRetry($url, $body, $timeout);
        if (($res['ok'] ?? false) !== true) return $res;

        $text = $this->extractGeminiText($res['json'] ?? []);
        if (!$text) return ['ok' => false, 'error' => 'Gemini returned no title'];

        // ✅ clean title
        $title = trim(preg_replace('/\s+/', ' ', $text));
        $title = trim($title, "\"'`");

        // ✅ remove common prefixes Gemini might add
        $title = preg_replace('/^(title\s*:\s*|session\s*title\s*:\s*|chat\s*title\s*:\s*)/i', '', $title);
        $title = trim($title);

        // ✅ ensure single line only
        $title = strtok($title, "\n");
        $title = trim($title);

        // hard limit for DB column
        $title = Str::limit($title, 60, '');

        if ($title === '' || mb_strlen($title) < 3) {
            return ['ok' => false, 'error' => 'Generated title too short'];
        }

        return ['ok' => true, 'title' => $title];
    }

    /**
     * ✅ Helper: retry on Gemini overload (503) with small backoff
     */
    private function postGeminiWithRetry(string $url, array $body, int $timeout): array
    {
        $attempts = 0;
        $lastJson = null;
        $lastCode = null;

        while ($attempts < 3) {
            $attempts++;

            $httpRes = Http::timeout($timeout)
                ->acceptJson()
                ->asJson()
                ->post($url, $body);

            $lastCode = $httpRes->status();
            $lastJson = $httpRes->json();

            if ($httpRes->ok()) {
                return ['ok' => true, 'json' => $lastJson];
            }

            // Retry ONLY on overload/unavailable
            $statusStr = $lastJson['error']['status'] ?? null;
            if ($lastCode === 503 || $statusStr === 'UNAVAILABLE') {
                // simple backoff: 250ms, 600ms
                if ($attempts < 3) {
                    usleep($attempts === 1 ? 250_000 : 600_000);
                    continue;
                }
            }

            break;
        }

        return [
            'ok' => false,
            'error' => "Gemini request failed: HTTP " . ($lastCode ?? 'unknown'),
            'details' => $lastJson,
        ];
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
}
