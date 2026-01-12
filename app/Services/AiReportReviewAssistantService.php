<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\AiReportReview;

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

            // ✅ Flatten + normalize keys so checks match your actual payload
            $flatJson = $this->flattenJsonData($json);
            $flatJson = $this->normalizeSectionKeys($flatJson);

            // ✅ Photo items (text only)
            $photoItems = $report['photo_items'] ?? [];
            if (!is_array($photoItems)) $photoItems = [];

            // 2) Deterministic checks (NO AI)
            $flags = $this->ruleChecks($report, $flatJson, $photoItems, $options);

            // 3) Ask Gemini to summarize + problems + reviewer comment templates
            $prompt = $this->buildPrompt($report, $flatJson, $photoItems, $flags);

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
                    "maxOutputTokens" => 4098,
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

            $parsed = $this->safeJson($text);

            // If parsing fails, still return rule flags + plain text
            if (!$parsed) {
                $reviewId = $this->saveHistory($report, [
                    'mode' => 'fallback_text',
                    'analysis_text' => $text,
                    'flags' => $flags,
                ]);

                return [
                    'ok' => true,
                    'mode' => 'fallback_text',
                    'analysis_text' => $text,
                    'flags' => $flags,
                    'review_id' => $reviewId,
                ];
            }

            $review = [
                'reportSummary' => $parsed['reportSummary'] ?? '',
                'problemSummary' => $parsed['problemSummary'] ?? '',
                'defectsByItem' => $parsed['defectsByItem'] ?? [],   // ✅ ADD ONLY
                'focusAreas' => $parsed['focusAreas'] ?? [],         // ✅ ADD ONLY
                'topIssues' => $parsed['topIssues'] ?? [],
                'suggestedComments' => $parsed['suggestedComments'] ?? [],
                'notes' => $parsed['notes'] ?? [],
                'flags' => $flags,
            ];

            $reviewId = $this->saveHistory($report, $review);

            return [
                'ok' => true,
                'mode' => 'json',
                'review' => $review,
                'flags' => $flags,
                'review_id' => $reviewId,
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'error' => 'Server error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * ✅ Save AI review history to DB (ai_report_reviews)
     */
    private function saveHistory(array $report, array $outputReview): ?int
    {
        try {
            $row = AiReportReview::create([
                'user_id' => auth()->id(),
                'report_id' => $report['id'] ?? null,
                'provider' => 'gemini',
                'model' => config('gemini.model', 'gemini-2.5-flash'),
                'status' => 'generated',
                'input_payload' => [
                    'id' => $report['id'] ?? null,
                    'title' => $report['title'] ?? null,
                    'status' => $report['status'] ?? null,
                    'creation_date' => $report['creation_date'] ?? null,
                    'submission_date' => $report['submission_date'] ?? null,
                    'signed_at' => $report['signed_at'] ?? null,
                    'json_data' => $report['json_data'] ?? null,
                    'photo_items' => $report['photo_items'] ?? null,
                ],
                'output_review' => $outputReview,
            ]);

            return $row->id;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function flattenJsonData(array $json): array
    {
        $flat = $json;

        $mergeIfArray = function ($key) use (&$flat, $json) {
            if (isset($json[$key]) && is_array($json[$key])) {
                $flat = array_merge($flat, $json[$key]);
            }
        };

        $mergeIfArray('sections');
        $mergeIfArray('pv');
        $mergeIfArray('pv_report');
        $mergeIfArray('report');
        $mergeIfArray('data');
        $mergeIfArray('form');

        if (isset($json['json_data']) && is_array($json['json_data'])) {
            $flat = array_merge($flat, $json['json_data']);
        }

        return $flat;
    }

    private function normalizeSectionKeys(array $json): array
    {
        $map = [
            'initialFinding' => 'initial_finding',
            'externalFinding' => 'external_inspection',
            'internalFinding' => 'internal_inspection',
            'ndt' => 'ndt_results',
            'ndtResults' => 'ndt_results',

            'initial_finding' => 'initial_finding',
            'external_inspection' => 'external_inspection',
            'internal_inspection' => 'internal_inspection',
            'ndt_results' => 'ndt_results',
        ];

        foreach ($map as $from => $to) {
            if (array_key_exists($from, $json) && !array_key_exists($to, $json)) {
                $json[$to] = $json[$from];
            }
        }

        return $json;
    }

    /**
     * ✅ NEW (added only): helper to read metadata from:
     * - json_data
     * - report root
     * - common nested objects (photo_report/photoReports/etc)
     */
    private function metaGet(array $report, array $json, string $key)
    {
        // 1) direct from json_data
        if (array_key_exists($key, $json)) return $json[$key];

        // 2) direct from report root
        if (array_key_exists($key, $report)) return $report[$key];

        // 3) allow common aliases (inspectionDate vs inspection_date)
        $aliases = [];
        if ($key === 'inspectionDate') $aliases = ['inspection_date', 'inspection_date_at', 'inspection_at'];
        if ($key === 'pmt') $aliases = ['PMT', 'pmt_no', 'pmtNumber', 'pmt_number'];

        foreach ($aliases as $a) {
            if (array_key_exists($a, $json)) return $json[$a];
            if (array_key_exists($a, $report)) return $report[$a];
        }

        // 4) search in common nested containers
        $containers = [
            'photo_report', 'photoReport', 'photo_reports', 'photoReports',
            'meta', 'metadata', 'details', 'report_meta', 'reportMeta',
        ];

        foreach ($containers as $c) {
            if (isset($report[$c]) && is_array($report[$c])) {
                if (array_key_exists($key, $report[$c])) return $report[$c][$key];
                foreach ($aliases as $a) {
                    if (array_key_exists($a, $report[$c])) return $report[$c][$a];
                }
            }
        }

        return null;
    }

    /**
     * Deterministic checks (fast, reliable)
     * ✅ NOW reads PMT + Inspection Date from anywhere (json_data OR photo report meta)
     */
    private function ruleChecks(array $report, array $json, array $photoItems, array $options = []): array
    {
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
            // ✅ CHANGED (added only): use metaGet() instead of only $json[$k]
            $val = $this->metaGet($report, $json, $k);

            if ($val === null) {
                $missingMeta[] = ['key' => $k, 'label' => $label];
                continue;
            }
            if (is_string($val) && trim($val) === '') {
                $missingMeta[] = ['key' => $k, 'label' => $label];
            }
        }

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

        $photoItemIssues = $this->checkPhotoItems($photoItems);

        $severity = 0;
        $severity += count($missingSections) * 3;
        $severity += count($emptySections) * 2;
        $severity += count($consistencyIssues) * 2;
        $severity += count($riskFlags) * 2;
        $severity += count($tooShortSections) * 1;
        $severity += count($missingMeta) * 1;
        $severity += count($photoItemIssues) * 1;

        return [
            'missingSections' => $missingSections,
            'emptySections' => $emptySections,
            'tooShortSections' => $tooShortSections,
            'missingMeta' => $missingMeta,
            'consistencyIssues' => $consistencyIssues,
            'riskFlags' => $riskFlags,
            'photoItemIssues' => $photoItemIssues,
            'severityScore' => $severity,
        ];
    }

    private function checkPhotoItems(array $photoItems): array
    {
        $issues = [];

        foreach ($photoItems as $it) {
            if (!is_array($it)) continue;

            $id = $it['id'] ?? null;
            $title = trim((string)($it['title'] ?? 'Item'));
            $findings = trim((string)($it['findings'] ?? ''));
            $requirements = trim((string)($it['requirements'] ?? ''));

            $itemProblems = [];

            if ($title === '' || strtolower($title) === 'item') {
                $itemProblems[] = 'Missing/unclear item title.';
            }
            if ($findings === '') {
                $itemProblems[] = 'Findings is empty.';
            } elseif (mb_strlen($findings) < 10) {
                $itemProblems[] = 'Findings is too short.';
            }

            if ($requirements === '') {
                $itemProblems[] = 'Requirements is empty.';
            } elseif (mb_strlen($requirements) < 6) {
                $itemProblems[] = 'Requirements is too short.';
            }

            $f = strtolower($findings);
            $hasDefect =
                str_contains($f, 'corrosion') ||
                str_contains($f, 'pitting') ||
                str_contains($f, 'crack') ||
                str_contains($f, 'leak') ||
                str_contains($f, 'damage') ||
                str_contains($f, 'dent') ||
                str_contains($f, 'defect') ||
                str_contains($f, 'repair');

            $r = strtolower($requirements);
            $reqIsNil =
                $r === 'nil' ||
                str_contains($r, 'nil') ||
                str_contains($r, 'none') ||
                str_contains($r, 'n/a') ||
                str_contains($r, 'not applicable');

            if ($hasDefect && $requirements !== '' && $reqIsNil) {
                $itemProblems[] = 'Findings mention defect, but Requirements says Nil/None/N.A.';
            }

            if (!empty($itemProblems)) {
                $issues[] = [
                    'id' => $id,
                    'title' => $title,
                    'issues' => $itemProblems,
                ];
            }
        }

        return $issues;
    }

    private function buildPrompt(array $report, array $json, array $photoItems, array $flags): string
{
    $reportMeta = [
        'id' => $report['id'] ?? null,
        'title' => $report['title'] ?? null,
        'status' => $report['status'] ?? null,
        'creation_date' => $report['creation_date'] ?? null,
        'submission_date' => $report['submission_date'] ?? null,
        'signed_at' => $report['signed_at'] ?? null,
    ];

    $photoText = array_map(function ($it) {
        if (!is_array($it)) return null;
        return [
            'id' => $it['id'] ?? null,
            'title' => $it['title'] ?? null,
            'findings' => $it['findings'] ?? null,
            'requirements' => $it['requirements'] ?? null,
        ];
    }, $photoItems);
    $photoText = array_values(array_filter($photoText));

    $ctx = [
        'reportMeta' => $reportMeta,
        'flags' => $flags,
        'photoItems_textOnly' => $photoText,
    ];

    return <<<PROMPT
You are an "AI Review Assistant" for an inspection report reviewer.

IMPORTANT RULES:
- Do NOT analyze images. ONLY use the TEXT provided.
- You MUST NOT invent values (thickness, pressure, NDT readings, cert numbers, extra dates).
- Use photo item "findings" to detect defect mentions (corrosion, pitting, crack, leak, damage, dent, repair, etc.)
- If a photo item findings mention defect but requirements says Nil/None/N/A, flag it as inconsistency.

GOAL:
Create a reviewer-friendly summary focusing on defects and where to focus.

TASK:
1) reportSummary (1–3 sentences).
2) problemSummary (1–3 sentences).
3) defectsByItem: For each photo item that mentions defect/problem, list:
   - item id, title
   - defectKeywords (array)
   - shortFinding (1 sentence)
   - requirementCheck (e.g. "OK", "Missing", "Inconsistent with defect")
4) focusAreas: a short prioritized list of what reviewer should focus on next.
5) topIssues: bullet list derived from flags + defect items.
6) suggestedComments: 2–5 ready-to-copy reviewer comments. Include at least 1 comment referencing the specific item IDs with defects.

OUTPUT FORMAT:
Return STRICT JSON ONLY (no markdown, no extra text) with this schema:

{
  "reportSummary": "string",
  "problemSummary": "string",
  "defectsByItem": [
    {
      "id": 123,
      "title": "string",
      "defectKeywords": ["corrosion","pitting"],
      "shortFinding": "string",
      "requirementCheck": "OK | Missing | Inconsistent"
    }
  ],
  "focusAreas": ["...", "..."],
  "topIssues": ["...", "..."],
  "suggestedComments": [
    { "title": "Short title", "text": "comment text" }
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

    private function safeJson(string $text): ?array
    {
        $text = trim($text);
        $text = preg_replace('/^```json\s*/i', '', $text);
        $text = preg_replace('/^```\s*/', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        $text = trim($text);

        $decoded = json_decode($text, true);
        return is_array($decoded) ? $decoded : null;
    }
}
