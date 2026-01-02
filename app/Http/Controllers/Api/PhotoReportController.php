<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhotoReport;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PhotoReportController extends Controller
{
    /**
     * Get photo report data for a specific report
     * 
     * @param int $reportId The main report ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPhotoReport($reportId)
    {
        try {
            Log::info('Fetching photo report for report_id: ' . $reportId);
            
            // Find the main report
            $report = Report::where('report_id', $reportId)->first();
            
            if (!$report) {
                Log::warning('Report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }
            
            // Check if user has permission to view this report
            // Uncomment if you have authentication
            // if (!Auth::user()->can('view', $report)) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Unauthorized to view this report',
            //     ], 403);
            // }
            
            // Find existing photo report
            $photoReport = PhotoReport::where('report_id', $reportId)->first();
            
            // Extract json_data from main report
            $reportData = $report->json_data ?? [];
            
            Log::info('Photo report found: ' . ($photoReport ? 'Yes' : 'No'));
            
            return response()->json([
                'success' => true,
                'message' => 'Data retrieved successfully',
                'data' => [
                    'report_data' => $reportData,
                    'photo_report' => $photoReport,
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

    /**
     * Save or update photo report data
     * 
     * @param int $reportId The main report ID
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function savePhotoReport($reportId, Request $request)
    {
        try {
            Log::info('Saving photo report for report_id: ' . $reportId, $request->all());
            
            // Validate request
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
            
            // Find the main report
            $report = Report::where('report_id', $reportId)->first();
            
            if (!$report) {
                Log::warning('Main report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }
            
            // Check if user has permission to update this report
            // Uncomment if you have authentication
            // if (!Auth::user()->can('update', $report)) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Unauthorized to update this report',
            //     ], 403);
            // }
            
            // Check if report is in draft status (optional)
            if ($report->status === 'submitted' || $report->status === 'approved') {
                Log::warning('Cannot edit submitted report: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot edit photo report for submitted/approved report',
                ], 400);
            }
            
            // Prepare data for photo report
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
            
            // Find existing photo report or create new
            $photoReport = PhotoReport::updateOrCreate(
                ['report_id' => $reportId],
                $photoReportData
            );
            
            Log::info('Photo report ' . ($photoReport->wasRecentlyCreated ? 'created' : 'updated') . ' with ID: ' . $photoReport->id);
            
            // If this is a new photo report, update the main report
            if ($photoReport->wasRecentlyCreated) {
                // Update main report to indicate it has a photo report
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

    /**
     * Delete a photo report
     * 
     * @param int $reportId The main report ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletePhotoReport($reportId)
    {
        try {
            Log::info('Deleting photo report for report_id: ' . $reportId);
            
            // Find the main report
            $report = Report::where('report_id', $reportId)->first();
            
            if (!$report) {
                Log::warning('Main report not found: ' . $reportId);
                return response()->json([
                    'success' => false,
                    'message' => 'Report not found',
                ], 404);
            }
            
            // Check if user has permission to delete
            // Uncomment if you have authentication
            // if (!Auth::user()->can('delete', $report)) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Unauthorized to delete this photo report',
            //     ], 403);
            // }
            
            // Find and delete the photo report
            $photoReport = PhotoReport::where('report_id', $reportId)->first();
            
            if ($photoReport) {
                $photoReport->delete();
                Log::info('Photo report soft deleted: ' . $photoReport->id);
                
                // Update main report
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

    /**
     * Get all photo reports for a user (optional)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            Log::info('Fetching all photo reports');
            
            // Uncomment if you have authentication
            // $user = Auth::user();
            
            // Get reports that have photo reports
            $photoReports = PhotoReport::with('report')
                // ->whereHas('report', function ($query) use ($user) {
                //     $query->where('creator_id', $user->id);
                // })
                ->orderBy('updated_at', 'desc')
                ->paginate(10);
            
            Log::info('Found ' . $photoReports->total() . ' photo reports');
            
            return response()->json([
                'success' => true,
                'message' => 'Photo reports retrieved successfully',
                'data' => $photoReports,
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching photo reports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch photo reports',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}