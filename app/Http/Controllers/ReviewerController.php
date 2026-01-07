<?php

namespace App\Http\Controllers;

use App\Models\Report; // This should point to your reports table with the structure above
use App\Models\PhotoReport; // This is your photo_report table
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReviewerController extends Controller
{
    public function indexReviewer(Request $request)
    {
        // Query reports that need review
        // Assuming reports with no reviewer_id or specific status need review
        $query = Report::query();
        
        // Get reports that need review (not yet reviewed)
        // Adjust this logic based on your business rules
        $query->where(function($q) {
            $q->whereNull('reviewer_id') // Not assigned to a reviewer
              ->orWhere('status', 'submitted') // Or has status 'submitted'
              ->orWhere('status', 'draft'); // Or is in draft
        });
        
        // Exclude already approved/rejected reports
        $query->whereNotIn('status', ['approved', 'rejected']);
        
        // Order by submission date or creation date
        $query->orderBy('submission_date', 'desc')
              ->orderBy('created_at', 'desc');
        
        $reports = $query->get()->map(function ($report) {
            // Parse json_data from the reports table
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
            
            // Get photo reports for attachments count
            $photoReports = PhotoReport::where('report_id', $report->getKey())->get();
            $attachmentsCount = 0;
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
            
            // Count attachments (photos with image URLs)
            $attachmentsCount = count(array_filter($allPhotoItems, function($item) {
                return !empty($item['image']);
            }));
            
            // Extract data from json_data
            $title = $report->title ?? $jsonData['title'] ?? 'Untitled Report';
            $inspectorName = $jsonData['inspectorName'] ?? 'Unknown Inspector';
            $equipmentType = $jsonData['equipmentType'] ?? $jsonData['equipmentDescription'] ?? 'Unknown Equipment';
            $equipmentTag = $jsonData['equipmentTag'] ?? 'N/A';
            $inspectorRole = $jsonData['inspectorRole'] ?? 'Inspector';
            
            // Get report number from json_data or use id
            $reportNumber = $jsonData['reportNo'] ?? 'RPT-' . $report->id;
            
            // Get inspection date from json_data
            $inspectionDate = $jsonData['reportDate'] ?? $report->creation_date?->format('Y-m-d') ?? $report->created_at->format('Y-m-d');
            
            // Determine status - map your DB status to frontend status
            $statusMap = [
                'draft' => 'pending',
                'submitted' => 'pending',
                'in_review' => 'in-review',
                'approved' => 'approved',
                'revisions_requested' => 'revisions-requested',
                'rejected' => 'rejected',
            ];
            
            $status = $statusMap[$report->status] ?? 'pending';
            
            // Calculate days pending
            $submissionDate = $report->submission_date ?? $report->created_at;
            $daysPending = $submissionDate ? Carbon::parse($submissionDate)->diffInDays(now()) : 0;
            
            return [
                'id' => $report->getKey(),
                'report_id' => $report->getKey(),
                'report_number' => $reportNumber,
                'title' => $title,
                'json_data' => $jsonData,
                'submission_date' => $submissionDate?->format('Y-m-d H:i:s') ?? $report->created_at->format('Y-m-d H:i:s'),
                'inspection_date' => $inspectionDate,
                'status' => $status,
                'db_status' => $report->status, // Keep original status for reference
                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $report->updated_at->format('Y-m-d H:i:s'),
                'inspector_name' => $inspectorName,
                'inspector_role' => $inspectorRole,
                'equipment' => $equipmentType,
                'equipment_tag' => $equipmentTag,
                'pmt' => $jsonData['pmt'] ?? null, // From photo_report data
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

        // Calculate stats
        $totalPending = $reports->where('status', 'pending')->count();
        $inReview = $reports->where('status', 'in-review')->count();
        $revisionsNeeded = $reports->where('status', 'revisions-requested')->count();
        
        // Completed today (approved or rejected today)
        $completedToday = Report::whereDate('updated_at', today())
            ->whereIn('status', ['approved', 'rejected'])
            ->count();
            
        // Average review time (from submission to signing)
        $avgReviewTime = $this->calculateAverageReviewTime();
        
        // Approval rate
        $approvalRate = $this->calculateApprovalRate();
        
        // Overdue reviews (submitted more than 3 days ago and not reviewed)
        $overdueReviews = $reports->filter(function($report) {
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
    
    private function calculateAverageReviewTime(): string
    {
        // Calculate from submission_date to signed_at
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
        // 1) Decode reports.json_data
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

        // 2) Get ALL related photo_reports rows
        $photoReports = PhotoReport::where('report_id', $report->getKey())->get();

        // 3) Extract all photo items from photo_reports.report_data
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

        // 4) Report number
        $reportNumber = $jsonData['reportNo'] ?? 'RPT-' . $report->id;

        return Inertia::render('Reviewer/ShowReview', [
            'report' => [
                // ===== reports table =====
                'id' => $report->id,
                'report_number' => $reportNumber,
                'title' => $report->title ?? ($jsonData['title'] ?? 'Untitled Report'),
                'inspection_date' => $jsonData['reportDate'] ?? optional($report->creation_date)->format('Y-m-d'),
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
                'submission_date' => $report->submission_date?->format('Y-m-d H:i:s'),
                'signed_at' => $report->signed_at?->format('Y-m-d H:i:s'),

                // ===== photo_reports table (rows) =====
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

                // ===== extracted items from report_data JSON =====
                'photo_report_items' => $allPhotoItems,
            ],
        ]);
    }

}