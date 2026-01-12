<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiReportReviewAssistantService
{
    public function analyze(array $report, array $options = []): array
    {
        try {
            $apiKey  = config('gemini.api_key');
            $baseUrl = rtrim(config('gemini.base_url'), '/');
            $timeout = (int) config('gemini.request_timeout', 60);
            $model   = config('gemini.model', 'gemini-2.5-flash');

            if (!$apiKey) {
                return ['ok' => false, 'error' => 'GEMINI_API_KEY is missing in .env'];
            }

            // 1) Parse json_data safely
            $json = $report['json_data'] ?? [];
            if (is_string($json)) {
                $decoded = json_decode($json, true);
                $json = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($json)) {
                $json = [];
            }

            // 2) Run deterministic checks (NO AI)
            $flags = $this->ruleChecks($report, $json, $options);

            // 3) Ask Gemini to summarize flags + generate reviewer comment templates
            $prompt = $this->buildPrompt($report, $json, $flags);

            $url = "{$baseUrl}/v1beta/models/{$model}:generateContent?key={$apiKey}";

            $payload = [
                "contents" => [
                    [
                        "role" => "user",
                        "parts" => [
                            ["text" => $prompt]
                        ],
                    ],
                ],
                "generationConfig" => [
                    "temperature" => 0.3,
                    "topP" => 0.9,
                    "maxOutputTokens" => 4096,
                    "responseMimeType" => "application/json",
                ],
            ];

            $res = Http::timeout($timeout)
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            if (!$res->ok()) {
                return [
                    'ok' => false,
                    'error' => "Gemini request failed: HTTP " . $res->status(),
                    'details' => $res->json(),
                    'flags' => $flags,
                ];
            }

            $text = $this->extractGeminiText($res->json());
            if (!$text) {
                return ['ok' => false, 'error' => 'Gemini returned no text', 'flags' => $flags];
            }

            // Gemini MUST return JSON (we enforce in prompt). Parse it.
            $parsed = $this->safeJson($text);

            // If parsing fails, still return rule flags + plain text
            if (!$parsed) {
                return [
                    'ok' => true,
                    'mode' => 'fallback_text',
                    'analysis_text' => $text,
                    'flags' => $flags,
                ];
            }

            // Return combined final result
            return [
                'ok' => true,
                'mode' => 'json',
                'confidence' => $parsed['confidence'] ?? 'medium',
                'suggestedAction' => $parsed['suggestedAction'] ?? 'revision_requested',
                'topIssues' => $parsed['topIssues'] ?? [],
                'suggestedComments' => $parsed['suggestedComments'] ?? [],
                'notes' => $parsed['notes'] ?? [],
                'flags' => $flags,
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'error' => 'Server error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Deterministic checks (fast, reliable)
     */
    private function ruleChecks(array $report, array $json, array $options = []): array
    {
        // These keys match what you used in seeders/templates:
        $sectionKeys = [
            'initial_finding' => 'Initial Findings / Pre-inspection',
            'external_inspection' => 'External Findings',
            'internal_inspection' => 'Internal Findings',
            'ndt_results' => 'NDT Results',
            'recommendations' => 'Recommendations',
        ];

        $metaKeys = [
            'equipmentTag' => 'Equipment Tag',
            'equipmentType' => 'Equipment Type',
            'plantUnitArea' => 'Plant Unit/Area',
            'doshRegistration' => 'DOSH Registration',
            'pmt' => 'PMT',
            'reportDate' => 'Report Date',
            'inspectionDate' => 'Inspection Date',
            'publishDate' => 'Publish Date',
        ];


        $missingSections = [];
        $emptySections = [];
        $tooShortSections = [];

        foreach ($sectionKeys as $k => $label) {
            $val = $json[$k] ?? null;
            $txt = is_string($val) ? trim($val) : '';

            if (!array_key_exists($k, $json)) {
                $missingSections[] = ['key' => $k, 'label' => $label];
                continue;
            }
            if ($txt === '') {
                $emptySections[] = ['key' => $k, 'label' => $label];
                continue;
            }
            if (mb_strlen($txt) < 25) {
                $tooShortSections[] = ['key' => $k, 'label' => $label, 'len' => mb_strlen($txt)];
            }
        }

        $missingMeta = [];
        foreach ($metaKeys as $k => $label) {
            $val = $json[$k] ?? null;
            if ($val === null) {
                // allow doshRegistration optional? keep as missing but not severe
                $missingMeta[] = ['key' => $k, 'label' => $label];
                continue;
            }
            if (is_string($val) && trim($val) === '') {
                $missingMeta[] = ['key' => $k, 'label' => $label];
            }
        }

        // Consistency checks
        $consistencyIssues = [];
        $status = $report['status'] ?? null;
        $submission = $report['submission_date'] ?? null;
        $signedAt = $report['signed_at'] ?? null;

        if ($status === 'in_review' && empty($submission)) {
            $consistencyIssues[] = 'Status is in_review but submission_date is empty/null.';
        }

        $isCompleted = in_array($status, ['approved', 'closed'], true);
        if ($isCompleted && empty($signedAt)) {
            $consistencyIssues[] = 'Report marked completed (approved/closed) but signed_at is missing.';
        }

        // Risk flags based on keywords (simple + reliable)
        $riskFlags = [];
        $allText = strtolower(
            implode("\n\n", array_map(fn($v) => is_string($v) ? $v : '', $json))
        );

        $hasCorrosion = str_contains($allText, 'corrosion') || str_contains($allText, 'pitting') || str_contains($allText, 'rust');
        $hasCrack = str_contains($allText, 'crack');
        $hasLeak = str_contains($allText, 'leak') || str_contains($allText, 'leakage');

        $ndt = isset($json['ndt_results']) && is_string($json['ndt_results']) ? trim($json['ndt_results']) : '';
        if (($hasCorrosion || $hasCrack || $hasLeak) && $ndt === '') {
            $riskFlags[] = 'Mentions corrosion/crack/leak but NDT Results is empty.';
        }

        if (str_contains($allText, 'not accessible') || str_contains($allText, 'cannot access') || str_contains($allText, 'restricted')) {
            $reco = isset($json['recommendations']) && is_string($json['recommendations']) ? trim($json['recommendations']) : '';
            if ($reco === '') {
                $riskFlags[] = 'Mentions access limitation but Recommendations is empty (no follow-up plan).';
            }
        }

        // Severity scoring (for confidence suggestion later)
        $severity = 0;
        $severity += count($missingSections) * 3;
        $severity += count($emptySections) * 2;
        $severity += count($consistencyIssues) * 2;
        $severity += count($riskFlags) * 2;
        $severity += count($tooShortSections) * 1;
        $severity += count($missingMeta) * 1;

        return [
            'missingSections' => $missingSections,
            'emptySections' => $emptySections,
            'tooShortSections' => $tooShortSections,
            'missingMeta' => $missingMeta,
            'consistencyIssues' => $consistencyIssues,
            'riskFlags' => $riskFlags,
            'severityScore' => $severity,
        ];
    }

    private function buildPrompt(array $report, array $json, array $flags): string
    {
        // IMPORTANT: We only let AI summarize + write templates.
        // AI must not invent thickness/pressure/NDT values etc.
        $reportMeta = [
            'id' => $report['id'] ?? null,
            'title' => $report['title'] ?? null,
            'status' => $report['status'] ?? null,
            'creation_date' => $report['creation_date'] ?? null,
            'submission_date' => $report['submission_date'] ?? null,
            'signed_at' => $report['signed_at'] ?? null,
        ];

        $ctx = [
            'reportMeta' => $reportMeta,
            'flags' => $flags,
        ];

        return <<<PROMPT
You are an "AI Review Assistant" for an inspection report reviewer.

GOAL:
- Help reviewer decide APPROVE / REVISION_REQUESTED / REJECT.
- Reviewer makes the final decision.
- You MUST NOT invent inspection values (thickness, pressure, NDT readings, cert numbers, dates not provided).

INPUT:
You will receive deterministic flags computed by the system (missing sections, metadata, consistency issues, risk flags).

TASK:
1) Summarize the top issues in clear reviewer language.
2) Provide suggested reviewer comment templates (ready to copy).
3) Provide suggestedAction among:
   - "approve"
   - "revision_requested"
   - "reject"
4) Provide confidence among: "low", "medium", "high"
   - Confidence is only about completeness/consistency, NOT truth of inspection.

OUTPUT FORMAT:
Return STRICT JSON ONLY (no markdown, no extra text) with this schema:

{
  "confidence": "low|medium|high",
  "suggestedAction": "approve|revision_requested|reject",
  "topIssues": ["...", "...", "..."],
  "suggestedComments": [
    { "title": "Short title", "text": "comment text for reviewer to paste" }
  ],
  "notes": {
    "whatToCheckNext": ["...", "..."]
  }
}

DATA:
{$this->jsonPretty($ctx)}
PROMPT;
    }

    private function jsonPretty(array $arr): string
    {
        return json_encode($arr, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
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

        $text = trim($text);
        return $text !== '' ? $text : null;
    }

    /**
     * Gemini sometimes returns extra whitespace. This tries to parse robustly.
     */
    private function safeJson(string $text): ?array
    {
        $text = trim($text);

        // If model accidentally returns ```json ... ``` strip it
        $text = preg_replace('/^```json\s*/i', '', $text);
        $text = preg_replace('/^```\s*/', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);
        return is_array($decoded) ? $decoded : null;
    }
}
