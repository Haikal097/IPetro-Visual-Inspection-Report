<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\PhotoReport;
use App\Models\ReportReviewLog;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

// ✅ ADDED: notifications
use App\Notifications\ReportApproved;
use App\Notifications\ReportRejected;
use App\Notifications\ReportRevisionRequested;

class ReviewerController extends Controller
{
    public function indexReviewer(Request $request)
    {
        $query = Report::query();

        $query->whereIn('status', [
            'submitted',
            'in_review',
            'revisions_requested',
        ]);

        $query->whereNotIn('status', ['approved', 'rejected']);

        $query->orderBy('submission_date', 'desc')
              ->orderBy('created_at', 'desc');

        $reports = $query->get()->map(function ($report) {
            $jsonData = [];
            if ($report->json_data) {
                try {
                    $jsonData = is_string($report->json_data)
                        ? json_decode($report->json_data, true)
                        : $report->json_data;
                } catch (\Exception $e) {
                    $jsonData = [];
                }
            }

            $photoReports = PhotoReport::where('report_id', $report->getKey())->get();

            $allPhotoItems = [];
            foreach ($photoReports as $photoReport) {
                if ($photoReport->report_data) {
                    try {
                        $photoData = is_string($photoReport->report_data)
                            ? json_decode($photoReport->report_data, true)
                            : $photoReport->report_data;

                        if (!empty($photoData['items'])) {
                            $allPhotoItems = array_merge($allPhotoItems, $photoData['items']);
                        }
                    } catch (\Exception $e) {
                        // Skip invalid JSON
                    }
                }
            }

            $attachmentsCount = count(array_filter($allPhotoItems, function ($item) {
                return !empty($item['image']);
            }));

            $title = $report->title ?? $jsonData['title'] ?? 'Untitled Report';
            $inspectorName = $jsonData['inspectorName'] ?? 'Unknown Inspector';
            $equipmentType = $jsonData['equipmentType'] ?? $jsonData['equipmentDescription'] ?? 'Unknown Equipment';
            $equipmentTag = $jsonData['equipmentTag'] ?? 'N/A';
            $inspectorRole = $jsonData['inspectorRole'] ?? 'Inspector';

            // ✅ FIX (necessary): your PK is report_id, so $report->id can be null
            $reportNumber = $jsonData['reportNo'] ?? 'RPT-' . $report->getKey();

            $inspectionDate =
                $jsonData['reportDate']
                ?? ($report->creation_date ? Carbon::parse($report->creation_date)->format('Y-m-d') : null)
                ?? ($report->created_at ? Carbon::parse($report->created_at)->format('Y-m-d') : null);

            $statusMap = [
                'submitted' => 'pending',
                'in_review' => 'in-review',
                'revisions_requested' => 'revisions-requested',
                'approved' => 'approved',
                'rejected' => 'rejected',
            ];
            $status = $statusMap[$report->status] ?? 'pending';

            $submissionDate = $report->submission_date ?? $report->created_at;

            return [
                'id' => $report->getKey(),
                'report_id' => $report->getKey(),
                'report_number' => $reportNumber,
                'title' => $title,
                'json_data' => $jsonData,
                'submission_date' => $submissionDate?->format('Y-m-d H:i:s') ?? $report->created_at->format('Y-m-d H:i:s'),
                'inspection_date' => $inspectionDate,
                'status' => $status,
                'db_status' => $report->status,

                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $report->updated_at->format('Y-m-d H:i:s'),

                'inspector_name' => $inspectorName,
                'inspector_role' => $inspectorRole,
                'equipment' => $equipmentType,
                'equipment_tag' => $equipmentTag,

                'pmt' => $jsonData['pmt'] ?? null,
                'plant_unit' => $jsonData['plantUnitArea'] ?? $jsonData['plantUnit'] ?? null,
                'description' => $jsonData['description'] ?? null,

                'attachments' => $attachmentsCount,
                'has_photo_report' => $photoReports->count() > 0,
                'photo_report_id' => $photoReports->first()->id ?? null,

                'reviewer_id' => $report->reviewer_id,
                'creator_id' => $report->creator_id,
                'inspector_id' => $report->inspector_id,
            ];
        });

        $totalPending = $reports->where('status', 'pending')->count();
        $inReview = $reports->where('status', 'in-review')->count();
        $revisionsNeeded = $reports->where('status', 'revisions-requested')->count();

        $completedToday = Report::whereDate('updated_at', today())
            ->whereIn('status', ['approved', 'rejected'])
            ->count();

        $avgReviewTime = $this->calculateAverageReviewTime();
        $approvalRate = $this->calculateApprovalRate();

        $overdueReviews = $reports->filter(function ($report) {
            if ($report['status'] !== 'pending') return false;

            $submissionDate = $report['submission_date'] ? Carbon::parse($report['submission_date']) : null;
            if (!$submissionDate) return false;

            return $submissionDate->diffInDays(now()) > 3;
        })->count();

        $totalReviews = $reports->count();

        return Inertia::render('Reports/IndexReviewer', [
            'reviews' => $reports,
            'stats' => [
                'total_pending' => $totalPending,
                'in_review' => $inReview,
                'revisions_needed' => $revisionsNeeded,
                'completed_today' => $completedToday,
                'avg_review_time' => $avgReviewTime,
                'approval_rate' => $approvalRate,
                'overdue_reviews' => $overdueReviews,
                'total_reviews' => $totalReviews,
            ],
            'filters' => $request->only(['search', 'status', 'timeframe']),
        ]);
    }

    public function approvedPage(Request $request)
    {
        $query = Report::query();

        // Only get approved reports
        $query->where('status', 'approved');

        $query->orderBy('updated_at', 'desc')
            ->orderBy('created_at', 'desc');

        $reports = $query->get()->map(function ($report) {
            $jsonData = [];
            if ($report->json_data) {
                try {
                    $jsonData = is_string($report->json_data)
                        ? json_decode($report->json_data, true)
                        : $report->json_data;
                } catch (\Exception $e) {
                    $jsonData = [];
                }
            }

            $photoReports = PhotoReport::where('report_id', $report->getKey())->get();

            $allPhotoItems = [];
            foreach ($photoReports as $photoReport) {
                if ($photoReport->report_data) {
                    try {
                        $photoData = is_string($photoReport->report_data)
                            ? json_decode($photoReport->report_data, true)
                            : $photoReport->report_data;

                        if (!empty($photoData['items'])) {
                            $allPhotoItems = array_merge($allPhotoItems, $photoData['items']);
                        }
                    } catch (\Exception $e) {
                        // Skip invalid JSON
                    }
                }
            }

            $attachmentsCount = count(array_filter($allPhotoItems, function ($item) {
                return !empty($item['image']);
            }));

            $title = $report->title ?? $jsonData['title'] ?? 'Untitled Report';
            $inspectorName = $jsonData['inspectorName'] ?? 'Unknown Inspector';
            $equipmentType = $jsonData['equipmentType'] ?? $jsonData['equipmentDescription'] ?? 'Unknown Equipment';
            $equipmentTag = $jsonData['equipmentTag'] ?? 'N/A';
            $inspectorRole = $jsonData['inspectorRole'] ?? 'Inspector';

            $reportNumber = $jsonData['reportNo'] ?? 'RPT-' . $report->getKey();

            $inspectionDate =
                $jsonData['reportDate']
                ?? ($report->creation_date ? Carbon::parse($report->creation_date)->format('Y-m-d') : null)
                ?? ($report->created_at ? Carbon::parse($report->created_at)->format('Y-m-d') : null);

            $statusMap = [
                'submitted' => 'pending',
                'in_review' => 'in-review',
                'revisions_requested' => 'revisions-requested',
                'approved' => 'approved',
                'rejected' => 'rejected',
            ];
            $status = $statusMap[$report->status] ?? 'pending';

            $submissionDate = $report->submission_date ?? $report->created_at;

            return [
                'id' => $report->getKey(),
                'report_id' => $report->getKey(),
                'report_number' => $reportNumber,
                'title' => $title,
                'json_data' => $jsonData,
                'submission_date' => $submissionDate?->format('Y-m-d H:i:s') ?? $report->created_at->format('Y-m-d H:i:s'),
                'inspection_date' => $inspectionDate,
                'status' => $status,
                'db_status' => $report->status,

                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $report->updated_at->format('Y-m-d H:i:s'),

                'inspector_name' => $inspectorName,
                'inspector_role' => $inspectorRole,
                'equipment' => $equipmentType,
                'equipment_tag' => $equipmentTag,

                'pmt' => $jsonData['pmt'] ?? null,
                'plant_unit' => $jsonData['plantUnitArea'] ?? $jsonData['plantUnit'] ?? null,
                'description' => $jsonData['description'] ?? null,

                'attachments' => $attachmentsCount,
                'has_photo_report' => $photoReports->count() > 0,
                'photo_report_id' => $photoReports->first()->id ?? null,

                'reviewer_id' => $report->reviewer_id,
                'creator_id' => $report->creator_id,
                'inspector_id' => $report->inspector_id,
            ];
    });

    // Get stats for approved reports
    $totalApproved = $reports->count();
    $approvedToday = Report::whereDate('updated_at', today())
        ->where('status', 'approved')
        ->count();

    // Calculate approval rate for approved reports page (optional)
    $totalReports = Report::count();
    $approvalRate = $totalReports > 0 ? round(($totalApproved / $totalReports) * 100, 1) : 0;

    return Inertia::render('Reviewer/ApprovedReport', [
        'reviews' => $reports,
        'stats' => [
            'total_pending' => 0,
            'in_review' => 0,
            'revisions_needed' => 0,
            'completed_today' => $approvedToday,
            'avg_review_time' => '0h',
            'approval_rate' => $approvalRate . '%',
            'overdue_reviews' => 0,
            'total_reviews' => $totalApproved,
        ],
        'filters' => $request->only(['search', 'status', 'timeframe']),
    ]);
    }

    public function rejectedPage(Request $request)
    {
        $query = Report::query();

        // Only get rejected reports
        $query->where('status', 'rejected');

        $query->orderBy('updated_at', 'desc')
            ->orderBy('created_at', 'desc');

        $reports = $query->get()->map(function ($report) {
            $jsonData = [];
            if ($report->json_data) {
                try {
                    $jsonData = is_string($report->json_data)
                        ? json_decode($report->json_data, true)
                        : $report->json_data;
                } catch (\Exception $e) {
                    $jsonData = [];
                }
            }

            $photoReports = PhotoReport::where('report_id', $report->getKey())->get();

            $allPhotoItems = [];
            foreach ($photoReports as $photoReport) {
                if ($photoReport->report_data) {
                    try {
                        $photoData = is_string($photoReport->report_data)
                            ? json_decode($photoReport->report_data, true)
                            : $photoReport->report_data;

                        if (!empty($photoData['items'])) {
                            $allPhotoItems = array_merge($allPhotoItems, $photoData['items']);
                        }
                    } catch (\Exception $e) {
                        // Skip invalid JSON
                    }
                }
            }

            $attachmentsCount = count(array_filter($allPhotoItems, function ($item) {
                return !empty($item['image']);
            }));

            $title = $report->title ?? $jsonData['title'] ?? 'Untitled Report';
            $inspectorName = $jsonData['inspectorName'] ?? 'Unknown Inspector';
            $equipmentType = $jsonData['equipmentType'] ?? $jsonData['equipmentDescription'] ?? 'Unknown Equipment';
            $equipmentTag = $jsonData['equipmentTag'] ?? 'N/A';
            $inspectorRole = $jsonData['inspectorRole'] ?? 'Inspector';

            $reportNumber = $jsonData['reportNo'] ?? 'RPT-' . $report->getKey();

            $inspectionDate =
                $jsonData['reportDate']
                ?? ($report->creation_date ? Carbon::parse($report->creation_date)->format('Y-m-d') : null)
                ?? ($report->created_at ? Carbon::parse($report->created_at)->format('Y-m-d') : null);

            $statusMap = [
                'submitted' => 'pending',
                'in_review' => 'in-review',
                'revisions_requested' => 'revisions-requested',
                'approved' => 'approved',
                'rejected' => 'rejected',
            ];
            $status = $statusMap[$report->status] ?? 'pending';

            $submissionDate = $report->submission_date ?? $report->created_at;

            return [
                'id' => $report->getKey(),
                'report_id' => $report->getKey(),
                'report_number' => $reportNumber,
                'title' => $title,
                'json_data' => $jsonData,
                'submission_date' => $submissionDate?->format('Y-m-d H:i:s') ?? $report->created_at->format('Y-m-d H:i:s'),
                'inspection_date' => $inspectionDate,
                'status' => $status,
                'db_status' => $report->status,

                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $report->updated_at->format('Y-m-d H:i:s'),

                'inspector_name' => $inspectorName,
                'inspector_role' => $inspectorRole,
                'equipment' => $equipmentType,
                'equipment_tag' => $equipmentTag,

                'pmt' => $jsonData['pmt'] ?? null,
                'plant_unit' => $jsonData['plantUnitArea'] ?? $jsonData['plantUnit'] ?? null,
                'description' => $jsonData['description'] ?? null,

                'attachments' => $attachmentsCount,
                'has_photo_report' => $photoReports->count() > 0,
                'photo_report_id' => $photoReports->first()->id ?? null,

                'reviewer_id' => $report->reviewer_id,
                'creator_id' => $report->creator_id,
                'inspector_id' => $report->inspector_id,
            ];
        });

        // Get stats for rejected reports
        $totalRejected = $reports->count();
        $rejectedToday = Report::whereDate('updated_at', today())
            ->where('status', 'rejected')
            ->count();

        return Inertia::render('Reviewer/RejectedReport', [
            'reviews' => $reports,
            'stats' => [
                'total_pending' => 0,
                'in_review' => 0,
                'revisions_needed' => 0,
                'completed_today' => $rejectedToday,
                'avg_review_time' => '0h',
                'approval_rate' => '0%',
                'overdue_reviews' => 0,
                'total_reviews' => $totalRejected,
            ],
            'filters' => $request->only(['search', 'status', 'timeframe']),
        ]);
    }

    private function calculateAverageReviewTime(): string
    {
        $approvedReports = Report::where('status', 'approved')
            ->whereNotNull('submission_date')
            ->whereNotNull('signed_at')
            ->get();

        if ($approvedReports->isEmpty()) return '0';

        $totalDays = 0;
        foreach ($approvedReports as $report) {
            $totalDays += $report->signed_at->diffInDays($report->submission_date);
        }

        return number_format($totalDays / $approvedReports->count(), 1);
    }

    private function calculateApprovalRate(): string
    {
        $totalReviewed = Report::whereIn('status', ['approved', 'rejected'])->count();
        $approved = Report::where('status', 'approved')->count();

        if ($totalReviewed === 0) return '0';

        return number_format(($approved / $totalReviewed) * 100, 0);
    }

    public function showReview(Report $report)
    {
        $report->loadMissing('creator');

        if ($report->status === 'submitted') {
            $report->update([
                'status' => 'in_review',
                'reviewer_id' => $report->reviewer_id ?: Auth::id(),
            ]);
            $report->refresh();
        }

        $canReview = in_array($report->status, [
            'submitted',
            'in_review',
            'revisions_requested',
        ]);

        // ✅ Get the current authenticated user
        $user = Auth::user();
        
        // ✅ Build current user's signature URL if exists
        $currentUserSignatureUrl = null;
        if ($user && $user->signature_path) {
            $currentUserSignatureUrl = asset('storage/' . $user->signature_path);
        }

        // ✅ Get the report creator's signature URL (inspector)
        $creatorSignatureUrl = null;
        if ($report->creator && $report->creator->signature_path) {
            $creatorSignatureUrl = asset('storage/' . $report->creator->signature_path);
        }

        $jsonData = [];
        if ($report->json_data) {
            try {
                $jsonData = is_string($report->json_data)
                    ? json_decode($report->json_data, true)
                    : $report->json_data;
            } catch (\Exception $e) {
                $jsonData = [];
            }
        }

        $photoReports = PhotoReport::where('report_id', $report->getKey())->get();

        $allPhotoItems = [];
        foreach ($photoReports as $photoReport) {
            if (!$photoReport->report_data) continue;

            try {
                $photoData = is_string($photoReport->report_data)
                    ? json_decode($photoReport->report_data, true)
                    : $photoReport->report_data;

                if (!empty($photoData['items']) && is_array($photoData['items'])) {
                    $allPhotoItems = array_merge($allPhotoItems, $photoData['items']);
                }
            } catch (\Exception $e) {
                // skip invalid JSON
            }
        }

        $reportNumber = $jsonData['reportNo'] ?? 'RPT-' . $report->getKey();

        $reviewLogs = ReportReviewLog::where('report_id', $report->getKey())
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'report_id' => $log->report_id,
                    'reviewer_id' => $log->reviewer_id,
                    'action' => $log->action,
                    'message' => $log->message,
                    'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('Reviewer/ShowReview', [
            'report' => [
                'id' => $report->getKey(),
                'report_id' => $report->getKey(),
                'report_number' => $reportNumber,
                'title' => $report->title ?? ($jsonData['title'] ?? 'Untitled Report'),

                'inspection_date' =>
                    $jsonData['reportDate']
                    ?? ($report->creation_date ? Carbon::parse($report->creation_date)->format('Y-m-d') : null)
                    ?? ($report->created_at ? Carbon::parse($report->created_at)->format('Y-m-d') : null),

                'pmt' => $jsonData['pmt'] ?? null,
                'tag' => $jsonData['equipmentTag'] ?? null,
                'plant_unit' => $jsonData['plantUnitArea'] ?? ($jsonData['plantUnit'] ?? null),
                'description' => $jsonData['description'] ?? null,
                'report_data' => $jsonData,

                'created_at' => $report->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $report->updated_at?->format('Y-m-d H:i:s'),

                'status' => $report->status,
                'reviewer_id' => $report->reviewer_id,
                'creator_id' => $report->creator_id,
                'inspector_id' => $report->inspector_id,
                
                // ✅ Inspector signature (report creator)
                'inspector_signature_url' => $creatorSignatureUrl,
                
                // ✅ Reviewer signature (current user - for reference)
                'reviewer_signature_url' => $currentUserSignatureUrl,
                
                'submission_date' => $report->submission_date?->format('Y-m-d H:i:s'),
                'signed_at' => $report->signed_at?->format('Y-m-d H:i:s'),

                'can_review' => $canReview,

                'creator' => $report->creator ? [
                    'id' => $report->creator->id,
                    'name' => $report->creator->name,
                    'email' => $report->creator->email,
                    'phone' => $report->creator->phone ?? null,
                ] : null,

                'photo_reports' => $photoReports->map(function ($pr) {
                    return [
                        'id' => $pr->id,
                        'report_id' => $pr->report_id,
                        'report_title' => $pr->report_title,
                        'report_number' => $pr->report_number,
                        'inspection_date' => $pr->inspection_date,
                        'pmt' => $pr->pmt,
                        'tag' => $pr->tag,
                        'description' => $pr->description,
                        'plant_unit' => $pr->plant_unit,
                        'created_at' => $pr->created_at?->format('Y-m-d H:i:s'),
                        'updated_at' => $pr->updated_at?->format('Y-m-d H:i:s'),
                    ];
                }),

                'photo_report_items' => $allPhotoItems,
                'review_logs' => $reviewLogs,
            ],
            
            // ✅ Auth should be at the TOP LEVEL (not inside report)
            'auth' => [
                'user' => $user,
                'signatureUrl' => $currentUserSignatureUrl
            ]
        ]);
    }

    public function approve(Report $report)
    {
        abort_unless(Auth::user()?->role === 'reviewer' || Auth::user()?->role === 'admin', 403);

        abort_unless(in_array($report->status, ['submitted', 'in_review']), 403);

        $report->update([
            'status' => 'approved',
            'reviewer_id' => Auth::id(),
            'signed_at' => now(), // ⚠️ NOTE: keep as-is (you asked “don’t change”), but ideally use approved_at/reviewed_at instead
        ]);

        ReportReviewLog::create([
            'report_id' => $report->getKey(), // ✅ FIX
            'reviewer_id' => Auth::id(),
            'action' => 'approved',
            'message' => null,
        ]);

        // ✅ ADDED: send notification to inspector/creator
        $report->loadMissing('creator');
        $report->creator?->notify(new ReportApproved($report, Auth::user()));

        return back()->with('success', 'Report approved.');
    }

    public function reject(Request $request, Report $report)
    {
        abort_unless(Auth::user()?->role === 'reviewer' || Auth::user()?->role === 'admin', 403);

        abort_unless(in_array($report->status, ['submitted', 'in_review']), 403);

        $request->validate([
            'message' => 'nullable|string|max:2000',
        ]);

        $report->update([
            'status' => 'rejected',
            'reviewer_id' => Auth::id(),
        ]);

        ReportReviewLog::create([
            'report_id' => $report->getKey(), // ✅ FIX
            'reviewer_id' => Auth::id(),
            'action' => 'rejected',
            'message' => $request->message,
        ]);

        // ✅ ADDED: send notification to inspector/creator
        $report->loadMissing('creator');
        $report->creator?->notify(new ReportRejected($report, $request->message, Auth::user()));

        return back()->with('success', 'Report rejected.');
    }

    public function requestRevision(Request $request, Report $report)
    {
        abort_unless(Auth::user()?->role === 'reviewer' || Auth::user()?->role === 'admin', 403);

        abort_unless(in_array($report->status, ['submitted', 'in_review']), 403);

        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $report->update([
            'status' => 'revisions_requested',
            'reviewer_id' => Auth::id(),
        ]);

        ReportReviewLog::create([
            'report_id' => $report->getKey(), // ✅ FIX
            'reviewer_id' => Auth::id(),
            'action' => 'revisions_requested',
            'message' => $request->message,
        ]);

        // ✅ ADDED: send notification to inspector/creator
        $report->loadMissing('creator');
        $report->creator?->notify(new ReportRevisionRequested($report, $request->message, Auth::user()));

        return back()->with('success', 'Revision requested.');
    }
}
