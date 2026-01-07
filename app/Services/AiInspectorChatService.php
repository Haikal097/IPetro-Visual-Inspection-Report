<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiInspectorChatService
{
    public function chat(array $messages, array $context = []): array
    {
        $apiKey  = config('gemini.api_key');
        $baseUrl = config('gemini.base_url');
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
            $text = (string)($m['content'] ?? '');

            if ($text === '') continue;

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

        return ['ok' => true, 'reply' => $text];
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
