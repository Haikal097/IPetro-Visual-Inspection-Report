<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReviewAnalyticsController extends Controller
{
    public function __invoke(Request $request)
    {
        // timeframe filter: all | week | month | 3months
        $timeframe = $request->get('timeframe', 'month');

        $from = match ($timeframe) {
            'week' => now()->subDays(7),
            '3months' => now()->subDays(90),
            'all' => null,
            default => now()->subDays(30), // month
        };

        // Base reports query (YOUR table uses report_id PK)
        $reportsQ = DB::table('reports');

        if ($from) {
            $reportsQ->where(function ($q) use ($from) {
                $q->where('submission_date', '>=', $from)
                    ->orWhere('created_at', '>=', $from);
            });
        }

        // 1) Status breakdown
        $statusCounts = (clone $reportsQ)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        // Trend: submissions per day (last 14 days)
        $trendDays = 14;
        $trendFrom = now()->subDays($trendDays - 1)->startOfDay();

        $submissionsByDay = DB::table('reports')
            ->whereNotNull('submission_date')
            ->where('submission_date', '>=', $trendFrom)
            ->selectRaw('DATE(submission_date) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        // Completions: approved/rejected/archived
        $completionsByDay = DB::table('reports')
            ->whereIn('status', ['approved', 'rejected', 'archived'])
            ->where('updated_at', '>=', $trendFrom)
            ->selectRaw('DATE(updated_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        // Overdue list: submitted + still not completed after X days
        $overdueDays = 3;
        $overdueCutoff = now()->subDays($overdueDays);

        $overdueReports = DB::table('reports')
            ->leftJoin('users as u', 'u.id', '=', 'reports.creator_id')
            ->whereIn('reports.status', ['submitted', 'in_review'])
            ->whereNotNull('reports.submission_date')
            ->where('reports.submission_date', '<=', $overdueCutoff)
            ->orderBy('reports.submission_date', 'asc')
            ->limit(10)
            ->get([
                'reports.report_id',
                'reports.status',
                'reports.submission_date',
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(reports.json_data, '$.title')) as title"),
                'u.name as inspector_name',
            ])
            ->map(function ($r) {
                if (!$r->title) $r->title = 'Report #' . $r->report_id;
                return $r;
            });

        // ✅ Risk overview from photo_reports.report_data
        $keywords = ['corrosion', 'pitting', 'crack', 'leak', 'leakage', 'dent', 'damage', 'rust'];

        $photoReportsQ = DB::table('photo_reports')
            ->join('reports', 'reports.report_id', '=', 'photo_reports.report_id')
            ->when($from, function ($q) use ($from) {
                $q->where(function ($qq) use ($from) {
                    $qq->where('reports.submission_date', '>=', $from)
                        ->orWhere('reports.created_at', '>=', $from);
                });
            });

        $photoReports = (clone $photoReportsQ)
            ->orderBy('photo_reports.id', 'desc')
            ->limit(60)
            ->get([
                'photo_reports.id as photo_report_id',
                'photo_reports.report_id',
                'photo_reports.report_title',
                'photo_reports.report_number',
                'photo_reports.inspection_date',
                'photo_reports.pmt',
                'photo_reports.tag',
                'photo_reports.description',
                'photo_reports.plant_unit',
                'photo_reports.report_data',
                'reports.status as report_status',
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(reports.json_data, '$.title')) as pv_title"),
                'reports.creator_id',
            ]);

        $defectItems = [];
        $inconsistentItems = [];

        // ✅ counts & worst reports aggregation
        $keywordCounts = array_fill_keys($keywords, 0);
        $worstByReport = [];

        foreach ($photoReports as $pr) {
            $data = $pr->report_data;

            if (is_string($data)) {
                $decoded = json_decode($data, true);
                $data = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($data)) {
                $data = [];
            }

            $items = $data['items'] ?? $data['photo_items'] ?? [];
            if (!is_array($items)) $items = [];

            foreach ($items as $idx => $it) {
                if (!is_array($it)) continue;

                $title = (string)($it['title'] ?? $it['item_title'] ?? 'Item');
                $findingsRaw = (string)($it['findings'] ?? $it['finding'] ?? '');
                $requirementsRaw = (string)($it['requirements'] ?? $it['requirement'] ?? '');

                $findings = strtolower($findingsRaw);
                $requirements = strtolower($requirementsRaw);

                if (trim($findings) === '') continue;

                $matched = [];
                foreach ($keywords as $k) {
                    if (str_contains($findings, $k)) {
                        $matched[] = $k;
                        $keywordCounts[$k] = ($keywordCounts[$k] ?? 0) + 1;
                    }
                }
                if (empty($matched)) continue;

                $row = [
                    'report_id' => (int)$pr->report_id,
                    'photo_report_id' => (int)$pr->photo_report_id,
                    'item_id' => $idx,
                    'title' => $title,
                    'findings' => $findingsRaw,
                    'requirements' => $requirementsRaw,
                    'defectKeywords' => $matched,
                    'report_title' => (string)($pr->pv_title ?: $pr->report_title ?: ('Report #' . $pr->report_id)),
                    'report_number' => (string)($pr->report_number ?: ''),
                    'report_status' => (string)$pr->report_status,
                ];

                $defectItems[] = $row;

                $rid = (int)$pr->report_id;
                if (!isset($worstByReport[$rid])) {
                    $worstByReport[$rid] = [
                        'report_id' => $rid,
                        'report_title' => $row['report_title'],
                        'report_number' => $row['report_number'],
                        'report_status' => $row['report_status'],
                        'defect_count' => 0,
                        'keywords' => [],
                    ];
                }
                $worstByReport[$rid]['defect_count']++;

                foreach ($matched as $mk) {
                    $worstByReport[$rid]['keywords'][$mk] = ($worstByReport[$rid]['keywords'][$mk] ?? 0) + 1;
                }

                $reqIsNil =
                    $requirements === 'nil' ||
                    str_contains($requirements, 'nil') ||
                    str_contains($requirements, 'none') ||
                    str_contains($requirements, 'n/a') ||
                    str_contains($requirements, 'not applicable');

                if ($reqIsNil) {
                    $inconsistentItems[] = $row;
                }
            }
        }

        arsort($keywordCounts);

        $worstReports = array_values($worstByReport);
        usort($worstReports, function ($a, $b) {
            return ($b['defect_count'] ?? 0) <=> ($a['defect_count'] ?? 0);
        });
        $worstReports = array_slice($worstReports, 0, 10);

        $keywordCountsList = [];
        foreach ($keywordCounts as $k => $c) {
            $keywordCountsList[] = ['keyword' => $k, 'count' => (int)$c];
        }

        // Optional: AI summary (only if exists)
        $ai = null;
        if (DB::getSchemaBuilder()->hasTable('ai_report_reviews')) {
            $aiCounts = DB::table('ai_report_reviews')
                ->when($from, fn($q) => $q->where('created_at', '>=', $from))
                ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(output_review, '$.suggestedAction')) as action, COUNT(*) as total")
                ->groupBy('action')
                ->pluck('total', 'action');

            $ai = [
                'countsByAction' => $aiCounts,
            ];
        }

        // ====================== AI RISK SCORE (ADD ONLY, NO OVERDUE) ======================

        $severityKeywords = ['crack', 'leak', 'leakage', 'pitting'];

        $perReport = [];

        foreach ($defectItems as $row) {
            $rid = (int)($row['report_id'] ?? 0);
            if (!$rid) continue;

            if (!isset($perReport[$rid])) {
                $perReport[$rid] = [
                    'report_id' => $rid,
                    'report_title' => $row['report_title'] ?? ('Report #' . $rid),
                    'report_number' => $row['report_number'] ?? '',
                    'report_status' => $row['report_status'] ?? '',
                    'defect_count' => 0,
                    'inconsistent_count' => 0,
                    'severe_hits' => 0,
                    'short_findings' => 0,
                ];
            }

            $perReport[$rid]['defect_count']++;

            $findingsText = strtolower((string)($row['findings'] ?? ''));
            foreach ($severityKeywords as $sk) {
                if (str_contains($findingsText, $sk)) {
                    $perReport[$rid]['severe_hits']++;
                }
            }

            if (mb_strlen(trim((string)($row['findings'] ?? ''))) < 25) {
                $perReport[$rid]['short_findings']++;
            }
        }

        foreach ($inconsistentItems as $row) {
            $rid = (int)($row['report_id'] ?? 0);
            if (!$rid) continue;

            if (!isset($perReport[$rid])) {
                $perReport[$rid] = [
                    'report_id' => $rid,
                    'report_title' => $row['report_title'] ?? ('Report #' . $rid),
                    'report_number' => $row['report_number'] ?? '',
                    'report_status' => $row['report_status'] ?? '',
                    'defect_count' => 0,
                    'inconsistent_count' => 0,
                    'severe_hits' => 0,
                    'short_findings' => 0,
                ];
            }

            $perReport[$rid]['inconsistent_count']++;
        }

        $riskReports = [];

        foreach ($perReport as $rid => $st) {
            $defects = (int)$st['defect_count'];
            $incons = (int)$st['inconsistent_count'];
            $severe = (int)$st['severe_hits'];
            $short = (int)$st['short_findings'];

            $score =
                min(40, $defects * 8) +
                min(30, $incons * 15) +
                min(20, $severe * 10) +
                min(10, $short * 5);

            $score = max(0, min(100, (int)$score));

            $level = $score >= 70 ? 'High' : ($score >= 40 ? 'Medium' : 'Low');

            $reasons = [];
            if ($defects > 0) $reasons[] = "Defect mentions: {$defects}";
            if ($incons > 0) $reasons[] = "Inconsistencies: {$incons}";
            if ($severe > 0) $reasons[] = "Severe keywords hits: {$severe}";
            if ($short > 0) $reasons[] = "Short findings items: {$short}";
            if (empty($reasons)) $reasons[] = "No risk signals detected";

            $riskReports[] = [
                'report_id' => (int)$st['report_id'],
                'report_title' => (string)$st['report_title'],
                'report_number' => (string)$st['report_number'],
                'report_status' => (string)$st['report_status'],
                'score' => $score,
                'level' => $level,
                'reasons' => $reasons,
                'stats' => [
                    'defect_count' => $defects,
                    'inconsistent_count' => $incons,
                    'severe_hits' => $severe,
                    'short_findings' => $short,
                ],
            ];
        }

        usort($riskReports, fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));
        $riskReports = array_slice($riskReports, 0, 15);

        // ====================== GEMINI EXPLANATION + SAVE TO DB (FIXED) ======================

        $savedByReportId = [];
        $aiRiskAssessments = []; // ✅ ADD ONLY: what we return to React

        if (DB::getSchemaBuilder()->hasTable('ai_report_risk_assessments') && !empty($riskReports)) {
            try {
                // 1) Load existing for this timeframe (because unique(report_id, timeframe))
                $ids = array_values(array_unique(array_map(fn($x) => (int)$x['report_id'], $riskReports)));

                $existingRows = DB::table('ai_report_risk_assessments')
                    ->whereIn('report_id', $ids)
                    ->where('timeframe', $timeframe)
                    ->get();

                foreach ($existingRows as $er) {
                    $savedByReportId[(int)$er->report_id] = $er;
                }

                // 2) Only send missing ones to Gemini (reduce cost)
                $missing = [];
                foreach ($riskReports as $rr) {
                    $rid = (int)($rr['report_id'] ?? 0);
                    if (!$rid) continue;
                    if (!isset($savedByReportId[$rid])) {
                        $missing[] = $rr;
                    }
                }

                // 3) Call Gemini in one batch (your GeminiRiskExplainer already does batch)
                if (!empty($missing)) {
                    /** @var \App\Services\GeminiRiskExplainer $explainer */
                    $explainer = app(\App\Services\GeminiRiskExplainer::class);

                    // keep batch reasonable
                    $missingBatch = array_slice($missing, 0, 10);

                    $aiList = $explainer->explain($missingBatch, $keywords);

                    // index ai output by report_id
                    $aiById = [];
                    foreach ($aiList as $x) {
                        $rid = (int)($x['report_id'] ?? 0);
                        if ($rid) $aiById[$rid] = $x;
                    }

                    foreach ($missingBatch as $rr) {
                        $rid = (int)($rr['report_id'] ?? 0);
                        if (!$rid) continue;

                        $aiOut = $aiById[$rid] ?? [];

                        // IMPORTANT: save using YOUR MIGRATION COLUMNS
                        DB::table('ai_report_risk_assessments')->updateOrInsert(
                            [
                                'report_id' => $rid,
                                'timeframe' => $timeframe,
                            ],
                            [
                                'score' => (int)($rr['score'] ?? 0),
                                'level' => (string)($rr['level'] ?? 'Low'),
                                'reasons' => json_encode($rr['reasons'] ?? []),

                                'ai_explanation' => $aiOut['why'] ?? null,
                                'ai_confidence' => $aiOut['confidence'] ?? null,
                                'ai_recommendation' => $aiOut['recommendation'] ?? null,

                                'ai_model' => config('services.gemini.model') ?: config('gemini.model') ?: env('GEMINI_MODEL'),
                                'generated_at' => now(),
                                'updated_at' => now(),
                                'created_at' => now(),
                            ]
                        );
                    }

                    // reload rows after save
                    $existingRows = DB::table('ai_report_risk_assessments')
                        ->whereIn('report_id', $ids)
                        ->where('timeframe', $timeframe)
                        ->get();

                    $savedByReportId = [];
                    foreach ($existingRows as $er) {
                        $savedByReportId[(int)$er->report_id] = $er;
                    }
                }

                // 4) Attach saved ai fields into riskReports for UI display
                foreach ($riskReports as &$rr) {
                    $rid = (int)($rr['report_id'] ?? 0);
                    $saved = $savedByReportId[$rid] ?? null;

                    $rr['ai_explanation'] = $saved ? ($saved->ai_explanation ?? null) : null;
                    $rr['ai_confidence'] = $saved ? ($saved->ai_confidence ?? null) : null;
                    $rr['ai_recommendation'] = $saved ? ($saved->ai_recommendation ?? null) : null;
                    $rr['ai_model'] = $saved ? ($saved->ai_model ?? null) : null;
                }
                unset($rr);

                // ✅ ADD ONLY: build the payload React expects (why/confidence/recommendation/model)
                foreach ($savedByReportId as $rid => $saved) {
                    $aiRiskAssessments[] = [
                        'report_id' => (int)$saved->report_id,
                        'score' => (int)($saved->score ?? 0),
                        'level' => (string)($saved->level ?? 'Low'),

                        // map DB fields -> UI fields
                        'why' => $saved->ai_explanation ?? null,
                        'confidence' => $saved->ai_confidence ?? null,
                        'recommendation' => $saved->ai_recommendation ?? null,
                        'model' => $saved->ai_model ?? null,

                        // also include DB names (optional, harmless)
                        'ai_explanation' => $saved->ai_explanation ?? null,
                        'ai_confidence' => $saved->ai_confidence ?? null,
                        'ai_recommendation' => $saved->ai_recommendation ?? null,
                        'ai_model' => $saved->ai_model ?? null,

                        'created_at' => (string)($saved->created_at ?? ''),
                    ];
                }
            } catch (\Throwable $e) {
                // keep analytics page working even if Gemini fails
                $aiRiskAssessments = [];
            }
        }

        // ====================== END GEMINI EXPLANATION + SAVE ======================

        return Inertia::render('Reviewer/Analytics', [
            'filters' => [
                'timeframe' => $timeframe,
                'overdueDays' => $overdueDays,
            ],
            'workload' => [
                'statusCounts' => $statusCounts,
                'submissionsByDay' => $submissionsByDay,
                'completionsByDay' => $completionsByDay,
                'overdueReports' => $overdueReports,
            ],
            'risk' => [
                'keywords' => $keywords,
                'keywordCounts' => $keywordCountsList,
                'worstReports' => $worstReports,
                'defectItems' => array_slice($defectItems, 0, 60),
                'inconsistentItems' => array_slice($inconsistentItems, 0, 25),

                'riskScores' => $riskReports, // includes ai_explanation now
            ],

            // ✅ ADD ONLY: THIS is what your TSX is using (aiByReportId Map)
            'aiRiskAssessments' => $aiRiskAssessments,

            'ai' => $ai,
        ]);
    }
}
