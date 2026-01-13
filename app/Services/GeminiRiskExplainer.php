<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiRiskExplainer
{
    public function explain(array $reports, array $keywords = []): array
    {
        // Support both config styles:
        // - services.gemini.key (common)
        // - gemini.api_key (your GeminiService style)
        $key = config('services.gemini.key') ?: config('gemini.api_key') ?: env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?: config('gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.5-flash');

        if (!$key || empty($reports)) {
            return [];
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        // Strict JSON shape
        $schemaHint = [
            'reports' => [
                [
                    'report_id' => 0,
                    'confidence' => 'low|medium|high',
                    'why' => 'short explanation',
                    'recommendation' => 'approve|request_revision|reject',
                    'next_steps' => ['bullet', 'bullet'],
                ],
            ],
        ];

        $prompt = [
            "You are an assistant for inspection report review analytics.",
            "Goal: Explain why each report is risky based ONLY on the provided signals.",
            "Do not invent facts. Keep it short and reviewer-friendly.",
            "",
            "Signals per report include: score (0-100), level (Low/Medium/High), reasons, and stats counts.",
            "Keywords list (for context only): " . implode(", ", $keywords),
            "",
            "Return JSON ONLY, matching this shape:\n" . json_encode($schemaHint, JSON_PRETTY_PRINT),
            "",
            "INPUT REPORTS JSON:\n" . json_encode($reports, JSON_PRETTY_PRINT),
        ];

        $res = Http::timeout(25)
            ->withHeaders([
                'x-goog-api-key' => $key,
                'Content-Type' => 'application/json',
            ])
            ->post($endpoint, [
                'contents' => [[
                    'parts' => [[ 'text' => implode("\n", $prompt) ]],
                ]],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);

        if (!$res->ok()) {
            return [];
        }

        $text = data_get($res->json(), 'candidates.0.content.parts.0.text');
        if (!is_string($text) || trim($text) === '') return [];

        $decoded = json_decode($text, true);
        if (!is_array($decoded)) return [];

        return $decoded['reports'] ?? [];
    }
}
