<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhotoReport;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

// ✅ ADD THIS (required)
use App\Notifications\ReportSubmitted;

class PhotoReportController extends Controller
{
    public function getPhotoReport($reportId)
    {
        try {
            Log::info('Fetching photo report for report_id: ' . $reportId);

            $report = Report::where('report_id', $reportId)->first();

            if (!$report) {
                Log::warning('Report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }

            $photoReport = PhotoReport::where('report_id', $reportId)->first();

            $reportData = $report->json_data ?? [];

            Log::info('Photo report found: ' . ($photoReport ? 'Yes' : 'No'));

            return response()->json([
                'success' => true,
                'message' => 'Data retrieved successfully',
                'data' => [
                    'report_data' => $reportData,
                    'photo_report' => $photoReport,
                    'main_report' => [
                        'id' => $report->report_id,
                        'status' => $report->status,
                        'title' => $report->title,
                        'report_no' => $report->reportNo,
                        'submitted_at' => $report->submitted_at,
                        'submitted_by' => $report->submitted_by,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching photo report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load photo report data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function savePhotoReport($reportId, Request $request)
    {
        try {
            Log::info('Saving photo report for report_id: ' . $reportId, $request->all());

            $validator = Validator::make($request->all(), [
                'report_title' => 'required|string|max:255',
                'report_number' => 'required|string|max:100',
                'inspection_date' => 'required|date',
                'pmt' => 'nullable|string|max:100',
                'tag' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'plant_unit' => 'nullable|string|max:100',
                'report_data' => 'required|array',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed: ' . json_encode($validator->errors()));
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $report = Report::where('report_id', $reportId)->first();

            if (!$report) {
                Log::warning('Main report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }

            // ✅ IMPORTANT: Lock editing when under review/finalized
            if (in_array($report->status, ['submitted', 'in_review', 'approved'])) {
                Log::info("Read-only: photo report save ignored for report_id={$reportId}, status={$report->status}");

                $existing = PhotoReport::where('report_id', $reportId)->first();

                return response()->json([
                    'success' => true,
                    'read_only' => true,
                    'message' => 'Report is read-only. Changes are not saved.',
                    'data' => [
                        'photo_report' => $existing,
                        'photo_report_id' => $existing?->id,
                        'main_report_status' => $report->status,
                    ],
                ], 200);
            }

            $photoReportData = [
                'report_id' => $reportId,
                'report_title' => $request->report_title,
                'report_number' => $request->report_number,
                'inspection_date' => $request->inspection_date,
                'pmt' => $request->pmt,
                'tag' => $request->tag,
                'description' => $request->description,
                'plant_unit' => $request->plant_unit,
                'report_data' => $request->report_data,
            ];

            Log::info('Photo report data prepared', $photoReportData);

            $photoReport = PhotoReport::updateOrCreate(
                ['report_id' => $reportId],
                $photoReportData
            );

            Log::info('Photo report ' . ($photoReport->wasRecentlyCreated ? 'created' : 'updated') . ' with ID: ' . $photoReport->id);

            if ($photoReport->wasRecentlyCreated) {
                $report->update([
                    'has_photo_report' => true,
                    'photo_report_id' => $photoReport->id,
                ]);
                Log::info('Main report updated with photo report info');
            }

            return response()->json([
                'success' => true,
                'message' => 'Photo report saved successfully',
                'data' => [
                    'photo_report' => $photoReport,
                    'photo_report_id' => $photoReport->id,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error saving photo report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save photo report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function deletePhotoReport($reportId)
    {
        try {
            Log::info('Deleting photo report for report_id: ' . $reportId);

            $report = Report::where('report_id', $reportId)->first();

            if (!$report) {
                Log::warning('Main report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }

            $photoReport = PhotoReport::where('report_id', $reportId)->first();

            if ($photoReport) {
                $photoReport->delete();
                Log::info('Photo report soft deleted: ' . $photoReport->id);

                $report->update([
                    'has_photo_report' => false,
                    'photo_report_id' => null,
                ]);
                Log::info('Main report updated after photo report deletion');

                return response()->json([
                    'success' => true,
                    'message' => 'Photo report deleted successfully',
                ], 200);
            }

            Log::warning('Photo report not found for report_id: ' . $reportId);
            return response()->json([
                'success' => false,
                'message' => 'Photo report not found',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error deleting photo report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete photo report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function submitPhotoReport($reportId, Request $request)
    {
        try {
            Log::info('Submitting photo report for report_id: ' . $reportId, $request->all());

            $validator = Validator::make($request->all(), [
                'report_title' => 'required|string|max:255',
                'report_number' => 'required|string|max:100',
                'inspection_date' => 'required|date',
                'pmt' => 'nullable|string|max:100',
                'tag' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'plant_unit' => 'nullable|string|max:100',
                'report_data' => 'required|array',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed: ' . json_encode($validator->errors()));
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $report = Report::where('report_id', $reportId)->first();

            if (!$report) {
                Log::warning('Main report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }

            if (in_array($report->status, ['submitted', 'in_review', 'approved'])) {
                Log::warning('Cannot submit already submitted report: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report is already ' . $report->status,
                ], 400);
            }

            if ($report->status !== 'draft') {
                Log::warning('Report not in draft status: ' . $reportId . ' - Status: ' . $report->status);
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot submit report that is not in draft status',
                ], 400);
            }

            $photoReportData = [
                'report_id' => $reportId,
                'report_title' => $request->report_title,
                'report_number' => $request->report_number,
                'inspection_date' => $request->inspection_date,
                'pmt' => $request->pmt,
                'tag' => $request->tag,
                'description' => $request->description,
                'plant_unit' => $request->plant_unit,
                'report_data' => $request->report_data,
            ];

            Log::info('Photo report data prepared for submission', $photoReportData);

            $photoReport = PhotoReport::updateOrCreate(
                ['report_id' => $reportId],
                $photoReportData
            );

            Log::info('Photo report ' . ($photoReport->wasRecentlyCreated ? 'created' : 'updated') . ' with ID: ' . $photoReport->id);

            $report->update([
                'status' => 'submitted',
                'submitted_at' => now(),
                'has_photo_report' => true,
                'photo_report_id' => $photoReport->id,
                'submitted_by' => Auth::id() ?? null,
            ]);

            Log::info('Main report status updated to submitted for report_id: ' . $reportId);

            // ✅ SEND NOTIFICATION (after submit)
            $actor = Auth::user();

            if ($actor) {
                $actor->notify(new ReportSubmitted($report, $actor));
                Log::info("Notification sent to actor: user_id={$actor->id}, report_id={$reportId}");
            }

            if ($report->creator) {
                $report->creator->notify(new ReportSubmitted($report, $actor));
                Log::info("Notification sent to creator: user_id={$report->creator->id}, report_id={$reportId}");
            }

            return response()->json([
                'success' => true,
                'message' => 'Photo report submitted successfully',
                'data' => [
                    'photo_report' => $photoReport,
                    'photo_report_id' => $photoReport->id,
                    'main_report_status' => 'submitted',
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error submitting photo report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit photo report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $query = PhotoReport::query();

        if ($request->has('report_id')) {
            $query->where('report_id', $request->report_id);
        }

        $photoReports = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'photo_reports' => $photoReports
            ]
        ]);
    }
}
