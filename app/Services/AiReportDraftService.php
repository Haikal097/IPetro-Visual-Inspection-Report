<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiReportDraftService
{
    public function generate(array $form): array
    {
        $apiKey  = config('gemini.api_key');
        $baseUrl = config('gemini.base_url') ?: 'https://generativelanguage.googleapis.com';
        $timeout = (int) config('gemini.request_timeout', 60);
        $model   = env('GEMINI_MODEL', 'gemini-2.5-flash');

        if (!$apiKey) {
            return ['ok' => false, 'error' => 'GEMINI_API_KEY is missing in .env'];
        }

        $system = <<<SYS
You are a senior pressure vessel inspector writing a professional PV inspection report in DOSH-style.

TASK:
Improve and rewrite ONLY the provided text. Expand short inputs into a proper professional report style by adding:
- inspection procedure wording
- what was checked/verified/observed
- acceptance language (e.g., "no visible signs of…", "found satisfactory where accessible")
BUT you MUST NOT invent:
- thickness values, NDT readings, pressures, temperatures
- exact dates, certificate numbers, report references
- code clause numbers or standards not provided

STRICT RULES:
1) If a section input is empty => return "" for that section.
2) Keep the original meaning. Do not change conclusions.
3) Preserve numbering format if present (e.g., 1.1, 2.1). If no numbering, you may add structured numbering.
4) If the user input is very short (e.g., "ok", "good", "no issue"), expand using GENERAL inspection procedure language only.

STYLE GUIDE:
- Use clear professional sentences.
- Prefer numbered paragraphs like 1.1 / 2.1 / 3.1
- Use "where accessible / where seen" wording when needed.
- Use passive inspection language (observed, examined, verified).

SECTION EXPECTATIONS:
A) initialFinding: pre-inspection steps (isolation, cleaning, access, document review, safety)
B) externalFinding: external visual inspection (coating, shell, heads, supports, nozzles, nameplate, leakage, deformation)
C) internalFinding: internal visual inspection (shell, seams, heads, nozzles, manway, corrosion, pitting, deposits)
D) ndt: describe NDT method statement style, but DO NOT add readings; you may say "Refer attached NDT report" if user hinted.
E) recommendations: action-oriented, short, linked to stated findings

Return ONLY valid JSON with exactly these keys:
initialFinding, externalFinding, internalFinding, ndt, recommendations
SYS;

        $userText = $system . "\n\nPV report draft data:\n" . json_encode($form, JSON_UNESCAPED_SLASHES);

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
                "temperature" => 0.6,
                "topP" => 0.9,
                "maxOutputTokens" => 4096,
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
        if (!$text) {
            return ['ok' => false, 'error' => 'Gemini returned no text'];
        }

        // ✅ IMPORTANT: strip fences BEFORE json_decode
        $text = $this->stripCodeFences($text);

        // ✅ If looks like JSON but incomplete, retry once
        if ($this->looksIncompleteJson($text)) {
            $retryBody = $body;
            $retryBody["contents"][0]["parts"][0]["text"] =
                "Return ONLY complete valid JSON. No markdown. Must include ALL keys: initialFinding, externalFinding, internalFinding, ndt, recommendations.\n\n"
                . $userText;

            $retry = Http::timeout($timeout)
                ->acceptJson()
                ->asJson()
                ->post($url, $retryBody);

            if ($retry->ok()) {
                $retryText = $this->extractGeminiText($retry->json());
                if ($retryText) {
                    $text = $this->stripCodeFences($retryText);
                }
            }
        }

        // Try parse JSON directly
        $parsed = json_decode($text, true);

        // If model adds extra text, attempt recover JSON object
        if (!is_array($parsed)) {
            $jsonOnly = $this->extractJsonObject($text);
            $parsed = $jsonOnly ? json_decode($jsonOnly, true) : null;
        }

        if (!is_array($parsed)) {
            return ['ok' => false, 'error' => 'Gemini output was not valid JSON', 'raw' => $text];
        }

        // Ensure keys exist + string values
        $keys = ["initialFinding","externalFinding","internalFinding","ndt","recommendations"];
        foreach ($keys as $k) {
            if (!array_key_exists($k, $parsed)) $parsed[$k] = "";
            if (!is_string($parsed[$k])) $parsed[$k] = (string) $parsed[$k];
        }

        return ['ok' => true, 'draft' => $parsed];
    }

    private function extractGeminiText(array $response): ?string
    {
        $candidates = $response['candidates'] ?? null;
        if (!is_array($candidates) || empty($candidates)) return null;

        $parts = $candidates[0]['content']['parts'] ?? null;
        if (!is_array($parts) || empty($parts)) return null;

        // ✅ Join all parts
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

    private function looksIncompleteJson(string $text): bool
    {
        $t = ltrim($text);

        // starts like JSON object but doesn't end like one
        if (!str_starts_with($t, '{')) return false;

        // if we don't see a closing brace at all, it's almost certainly truncated
        if (strrpos($t, '}') === false) return true;

        // if last non-space char is not }, likely cut
        $end = rtrim($t);
        return !str_ends_with($end, '}');
    }
}
