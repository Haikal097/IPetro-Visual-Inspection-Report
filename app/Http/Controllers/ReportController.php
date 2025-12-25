<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function create()
    {
        // Render Inertia page for creating a new report
        return Inertia::render('Reports/Create'); // Make sure this path matches your React component
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'json_data.reportNo' => 'required|string|max:100',
            'json_data.equipmentTag' => 'required|string|max:100',
            'json_data.equipmentType' => 'required|string|max:100',
            'json_data.plantUnitArea' => 'required|string|max:200',
            'json_data.doshRegistration' => 'nullable|string|max:100', // Changed to nullable
            'json_data.reportDate' => 'required|date',
            'status' => 'required|in:draft,submitted',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $report = Report::create([
            'title' => $request->title,
            'creator_id' => Auth::id(),
            'status' => $request->status,
            'json_data' => $request->json_data,
            'submission_date' => $request->status === 'submitted' ? now() : null,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Report saved successfully',
            'data' => $report
        ], 201);
    }
    
    public function update(Request $request, $id)
    {
        $report = Report::findOrFail($id);
        $user = Auth::user();
        
        // Check authorization
        if ($report->creator_id !== $user->id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to edit this report'
            ], 403);
        }
        
        // Can't edit submitted/approved reports unless admin
        if (in_array($report->status, ['submitted', 'approved']) && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit submitted or approved reports'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'json_data.reportNo' => 'required|string|max:100',
            'json_data.equipmentTag' => 'required|string|max:100',
            'json_data.equipmentType' => 'required|string|max:100',
            'json_data.plantUnitArea' => 'required|string|max:200',
            'json_data.doshRegistration' => 'nullable|string|max:100', // Changed here too
            'json_data.reportDate' => 'required|date',
            'status' => 'required|in:draft,submitted',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $updateData = [
            'status' => $request->status,
            'json_data' => $request->json_data,
        ];
        
        // Only update submission_date if changing to submitted
        if ($request->status === 'submitted' && $report->status !== 'submitted') {
            $updateData['submission_date'] = now();
        }
        
        $report->update($updateData);
        
        return response()->json([
            'success' => true,
            'message' => 'Report updated successfully',
            'data' => $report
        ]);
    }
    
    public function show($id)
    {
        $report = Report::with(['creator', 'reviewer'])->findOrFail($id);
        $user = Auth::user();
        
        // Check if user can view this report
        if ($report->creator_id !== $user->id && !in_array($user->role, ['admin', 'reviewer'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this report'
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }
    
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Report::with(['creator', 'reviewer']);
        
        // Filter by creator (users can only see their own unless admin/reviewer)
        if (!in_array($user->role, ['admin', 'reviewer'])) {
            $query->where('creator_id', $user->id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by equipment type
        if ($request->has('equipment_type')) {
            $query->where('json_data->equipmentType', $request->equipment_type);
        }
        
        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('creation_date', '>=', $request->from_date);
        }
        
        if ($request->has('to_date')) {
            $query->where('creation_date', '<=', $request->to_date);
        }
        
        // Paginate results
        $perPage = $request->get('per_page', 20);
        $reports = $query->orderBy('creation_date', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }
    
    public function submit($id)
    {
        $report = Report::findOrFail($id);
        
        if ($report->creator_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to submit this report'
            ], 403);
        }
        
        if ($report->submit()) {
            return response()->json([
                'success' => true,
                'message' => 'Report submitted for review',
                'data' => $report->fresh()
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to submit report'
        ], 500);
    }
    
    public function approve($id)
    {
        $report = Report::findOrFail($id);
        $user = Auth::user();
        
        // Only reviewer or admin can approve
        if ($report->reviewer_id !== $user->id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to approve this report'
            ], 403);
        }
        
        if ($report->approve($user->id)) {
            return response()->json([
                'success' => true,
                'message' => 'Report approved successfully',
                'data' => $report->fresh()
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to approve report'
        ], 500);
    }

    public function finalize(Request $request, Report $report)
    {
        $user = $request->user();

        // Must have signature
        if (!$user->signature_path || !Storage::disk('public')->exists($user->signature_path)) {
            return back()->withErrors([
                'signature' => 'Please create your digital signature before finalizing the report.',
            ]);
        }

        // Stamp signing data
        $report->inspector_id = $user->id;
        $report->signed_at = now(); // timezone should be Asia/Kuala_Lumpur in config/app.php
        $report->signed_ip = $request->ip();
        $report->signed_user_agent = substr((string)$request->userAgent(), 0, 512);

        // Generate verification token once
        if (!$report->verification_token) {
            $report->verification_token = Str::random(64);
        }

        // Snapshot signature
        $snapshotSig = "reports/{$report->id}/signature.png";
        Storage::disk('public')->copy($user->signature_path, $snapshotSig);
        $report->signature_snapshot_path = $snapshotSig;

        // Signature hash
        $sigBytes = Storage::disk('public')->get($snapshotSig);
        $report->signature_sha256 = hash('sha256', $sigBytes);

        $report->save();

        // Generate SIGNED PDF snapshot (freeze)
        $pdfPath = "reports/{$report->id}/final_report.pdf";
        $pdf = Pdf::loadView('reports.pdf', [
            'report' => $report->fresh()->load('inspector'),
        ]);

        Storage::disk('public')->put($pdfPath, $pdf->output());
        $report->pdf_snapshot_path = $pdfPath;

        // PDF hash
        $pdfBytes = Storage::disk('public')->get($pdfPath);
        $report->pdf_sha256 = hash('sha256', $pdfBytes);

        $report->save();

        // Audit log (optional)
        ReportAudit::create([
            'report_id' => $report->id,
            'user_id' => $user->id,
            'action' => 'FINALIZED',
            'meta' => [
                'signed_ip' => $report->signed_ip,
                'signed_at' => $report->signed_at?->toISOString(),
            ],
        ]);

        return back()->with('success', 'Report finalized, signed, and PDF snapshot saved.');
    }

        public function download(Request $request, Report $report)
    {
        // Only allow if finalized
        if (!$report->pdf_snapshot_path || !Storage::disk('public')->exists($report->pdf_snapshot_path)) {
            return back()->withErrors(['pdf' => 'PDF not available. Finalize the report first.']);
        }

        // Audit optional
        \App\Models\ReportAudit::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'action' => 'DOWNLOADED_PDF',
            'meta' => ['ip' => $request->ip()],
        ]);

        return Storage::disk('public')->download($report->pdf_snapshot_path, "REPORT-{$report->id}.pdf");
    }

        public function verify(string $token)
    {
        $report = \App\Models\Report::where('verification_token', $token)->firstOrFail();

        return inertia('Reports/Verify', [
            'report' => [
                'id' => $report->id,
                'signed_at' => optional($report->signed_at)->toISOString(),
                'pdf_sha256' => $report->pdf_sha256,
                'signature_sha256' => $report->signature_sha256,
            ],
        ]);
    }

}