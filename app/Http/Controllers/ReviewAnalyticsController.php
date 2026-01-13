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

        // ✅ ADD ONLY: counts & worst reports aggregation
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
                    'item_index' => $idx,
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

        // ✅ FIX: match your file path resources/js/pages/Reviewer/Analytics.tsx
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
            ],
            'ai' => $ai,
        ]);
    }
}
