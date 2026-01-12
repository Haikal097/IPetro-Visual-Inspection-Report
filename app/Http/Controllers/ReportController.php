<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;

// ✅ ADDED (needed for finalize/download/verify functions you already wrote)
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// ✅ If you actually use these models/classes, keep them.
// If not, you can remove later, but I’m NOT touching your logic.
use App\Models\PhotoReport;
use App\Models\ReportAudit;
use App\Models\ReportReviewLog;
use Barryvdh\DomPDF\Facade\Pdf;

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
            'json_data.doshRegistration' => 'nullable|string|max:100',
            'json_data.reportDate' => 'required|date',
            'status' => 'required|in:draft,submitted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Start database transaction
        \DB::beginTransaction();

        try {
            // 1. Create main report in reports table
            $report = Report::create([
                'title' => $request->title,
                'creator_id' => Auth::id(),
                'status' => $request->status,
                'json_data' => $request->json_data,
                'submission_date' => $request->status === 'submitted' ? now() : null,
            ]);

            // 2. Create photo report with ONLY report_id (all other fields NULL)
            \DB::table('photo_reports')->insert([
                'report_id' => $report->report_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Get the ID of the newly created photo report
            $photoReportId = \DB::getPdo()->lastInsertId();

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Report saved successfully',
                'data' => [
                    'report' => $report,
                    'photo_report_id' => $photoReportId,
                ]
            ], 201);

        } catch (\Exception $e) {
            \DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to save report: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
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

        // ✅ lock editing during review (submitted/in_review/approved) unless admin
        // ✅ allow revisions_requested
        if (in_array($report->status, ['submitted', 'in_review', 'approved']) && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit submitted, in review, or approved reports'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'json_data.reportNo' => 'required|string|max:100',
            'json_data.equipmentTag' => 'required|string|max:100',
            'json_data.equipmentType' => 'required|string|max:100',
            'json_data.plantUnitArea' => 'required|string|max:200',
            'json_data.doshRegistration' => 'nullable|string|max:100',
            'json_data.reportDate' => 'required|date',

            // ✅ IMPORTANT: inspector edit endpoint should NOT allow submitted (use resubmit route)
            // Admin can still set anything if you want (handled below)
            'status' => $user->role === 'admin'
                ? 'required|in:draft,submitted,in_review,revisions_requested,approved,rejected'
                : 'required|in:draft,revisions_requested',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // ✅ prevent inspector from changing status away from revisions_requested except to draft (optional safety)
        if ($user->role !== 'admin') {
            // If currently revisions_requested, allow only draft/revisions_requested save
            if ($report->status === 'revisions_requested' && !in_array($request->status, ['draft', 'revisions_requested'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid status change. Please use Resubmit to send back to reviewer.'
                ], 403);
            }
        }

        $updateData = [
            'title' => $request->title,
            'status' => $request->status,
            'json_data' => $request->json_data,
        ];

        // ✅ Only update submission_date when admin sets to submitted from a non-submitted state
        // (Inspector resubmit uses resubmit() method)
        if ($user->role === 'admin' && $request->status === 'submitted' && $report->status !== 'submitted') {
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

        // ✅ ADDED (necessary): safe report key for PK report_id
        $rid = $report->getKey();

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
        // ✅ CHANGED (necessary): use $rid instead of $report->id
        $snapshotSig = "reports/{$rid}/signature.png";
        Storage::disk('public')->copy($user->signature_path, $snapshotSig);
        $report->signature_snapshot_path = $snapshotSig;

        // Signature hash
        $sigBytes = Storage::disk('public')->get($snapshotSig);
        $report->signature_sha256 = hash('sha256', $sigBytes);

        $report->save();

        // Generate SIGNED PDF snapshot (freeze)
        // ✅ CHANGED (necessary): use $rid instead of $report->id
        $pdfPath = "reports/{$rid}/final_report.pdf";
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
        // ✅ CHANGED (necessary): use $rid instead of $report->id
        ReportAudit::create([
            'report_id' => $rid,
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
        // ✅ ADDED (necessary): safe report key for PK report_id
        $rid = $report->getKey();

        // Only allow if finalized
        if (!$report->pdf_snapshot_path || !Storage::disk('public')->exists($report->pdf_snapshot_path)) {
            return back()->withErrors(['pdf' => 'PDF not available. Finalize the report first.']);
        }

        // Audit optional
        // ✅ CHANGED (necessary): use $rid instead of $report->id
        \App\Models\ReportAudit::create([
            'report_id' => $rid,
            'user_id' => $request->user()->id,
            'action' => 'DOWNLOADED_PDF',
            'meta' => ['ip' => $request->ip()],
        ]);

        // ✅ CHANGED (necessary): use $rid in filename too
        return Storage::disk('public')->download($report->pdf_snapshot_path, "REPORT-{$rid}.pdf");
    }

    public function verify(string $token)
    {
        $report = \App\Models\Report::where('verification_token', $token)->firstOrFail();

        // ✅ ADDED (necessary): safe report key for PK report_id
        $rid = $report->getKey();

        return inertia('Reports/Verify', [
            'report' => [
                'id' => $rid,
                'signed_at' => optional($report->signed_at)->toISOString(),
                'pdf_sha256' => $report->pdf_sha256,
                'signature_sha256' => $report->signature_sha256,
            ],
        ]);
    }

    private function reportChecklist($report, $user)
    {
        // ✅ CHANGED (necessary): json_data may already be array
        $data = $report->json_data ?? [];
        if (is_string($data)) {
            $data = json_decode($data, true) ?: [];
        }

        $hasEquipment = !empty($data['equipment'] ?? null);
        $hasFindings  = !empty($data['findings'] ?? null);
        $hasReco      = !empty($data['recommendations'] ?? null);

        $hasSignature = !empty($user->signature_path);

        return [
            'equipment' => $hasEquipment,
            'findings' => $hasFindings,
            'recommendations' => $hasReco,
            'signature' => $hasSignature,
            'ready' => ($hasEquipment && $hasFindings && $hasReco && $hasSignature),
        ];
    }

    public function pvReport()
    {
        $u = auth()->user();

        $signatureUrl = $u?->signature_path
            ? asset('storage/' . $u->signature_path)
            : null;

        return Inertia::render('Reports/PVReport', [
            'signatureUrl' => $signatureUrl,
            'checklist' => [
                'equipment' => false,
                'initial' => false,
                'external' => false,
                'internal' => false,
                'ndt' => false,
                'recommendations' => false,

                'signature' => !empty($u?->signature_path),

                'ready' => !empty($u?->signature_path), // update later
            ],
        ]);
    }

    // ✅ THIS HELPER IS USED BY reportsPage()
    private function countPhotoReportImages($photoReport): int
    {
        if (!$photoReport) return 0;

        // report_data might be JSON string OR already array
        $data = $photoReport->report_data;

        if (is_string($data)) {
            $data = json_decode($data, true);
        }

        if (!is_array($data)) return 0;

        $items = $data['items'] ?? [];
        if (!is_array($items)) return 0;

        // count only items that have "image"
        return collect($items)
            ->filter(fn ($it) => !empty($it['image']))
            ->count();
    }

    public function reportsPage(Request $request)
    {
        $user = Auth::user();

        $query = Report::with(['creator', 'reviewer', 'photoReport', 'equipmentTemplate']);

        // Users can only see their own reports unless admin/reviewer
        if (!in_array($user->role, ['admin', 'reviewer'])) {
            $query->where('creator_id', $user->id);
        }

        // optional: filter status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // optional: search (title, equipmentTag, equipmentType from json_data)
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('json_data->equipmentTag', 'like', "%{$q}%")
                    ->orWhere('json_data->equipmentType', 'like', "%{$q}%");
            });
        }

        $reports = $query->orderBy('creation_date', 'desc')->get();

        // ✅ CHANGED (necessary): include the extra statuses in stats
        $stats = [
            'total' => $reports->count(),
            'draft' => $reports->where('status', 'draft')->count(),
            'submitted' => $reports->where('status', 'submitted')->count(),
            'approved' => $reports->where('status', 'approved')->count(),
            'rejected' => $reports->where('status', 'rejected')->count(),
            'in_review' => $reports->where('status', 'in_review')->count(),
            'revisions_requested' => $reports->where('status', 'revisions_requested')->count(),
        ];

        // ✅ ADDED (necessary): fetch all review logs in ONE query (no N+1)
        $reportIds = $reports->map(fn($r) => $r->getKey())->values()->all();

        $logsByReportId = \App\Models\ReportReviewLog::whereIn('report_id', $reportIds)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('report_id');

        // Map DB -> your UI shape
        $mappedReports = $reports->map(function ($r) use ($logsByReportId) {
            $json = $r->json_data ?? [];

            // ✅ ADDED (necessary): prepare logs + latest reason
            $logs = $logsByReportId[$r->getKey()] ?? collect();

            $reviewLogs = $logs->map(function ($l) {
                return [
                    'id' => $l->id,
                    'action' => $l->action,
                    'message' => $l->message,
                    'created_at' => $l->created_at?->format('Y-m-d H:i:s'),
                ];
            })->values()->all();

            $latestWithMessage = $logs->first(fn($l) => !empty(trim((string) $l->message))) ?? $logs->first();

            return [
                'id' => (int) $r->getKey(),
                'title' => $r->title ?? ('Report #' . $r->getKey()),

                'equipment' => $json['equipmentType'] ?? ($r->equipment_type ?? 'N/A'),
                'equipmentTag' => $json['equipmentTag'] ?? 'N/A',

                'status' => $r->status,

                'createdBy' => $r->creator?->name ?? 'Unknown',
                'createdAt' => $r->creation_date
                    ? Carbon::parse($r->creation_date)->format('Y-m-d')
                    : ($r->created_at ? Carbon::parse($r->created_at)->format('Y-m-d') : '—'),

                'lastUpdated' => $r->updated_at ? Carbon::parse($r->updated_at)->diffForHumans() : '—',

                'reviewer' => $r->reviewer?->name ?? 'Not Assigned',

                'dueDate' => $json['dueDate'] ?? null,

                // ✅ existing: image count
                'attachments' => $this->countPhotoReportImages($r->photoReport),

                // ✅ ADDED (necessary): what your modal needs
                'review_logs' => $reviewLogs, // optional history in modal
                'review_reason' => $latestWithMessage?->message,
                'review_reason_at' => $latestWithMessage?->created_at?->format('Y-m-d H:i:s'),
            ];
        });

        return inertia('Reports/IndexInspector', [
            'reports' => $mappedReports,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status ?? 'all',
                'q' => $request->q ?? '',
            ],
        ]);
    }

    public function resubmit(Report $report)
    {
        // Only report owner (creator) can resubmit
        abort_unless(Auth::id() === $report->creator_id, 403);

        // Only allow resubmit if revisions_requested
        abort_unless($report->status === 'revisions_requested', 403);

        $report->update([
            'status' => 'submitted',
            'submission_date' => now(),
        ]);

        // optional: clear reviewer assignment if you want
        // $report->update(['reviewer_id' => null]);

        ReportReviewLog::create([
            'report_id' => $report->report_id,  // ✅ correct
            // or BEST:
            // 'report_id' => $report->getKey(),
            'reviewer_id' => auth()->id(),
            'action' => 'resubmitted',
            'message' => null,
        ]);

        return redirect('/reports')->with('success', 'Report resubmitted successfully.');
    }

    public function edit(Report $report)
    {
        // Allow only owner or admin (optional)
        abort_unless(Auth::id() === $report->creator_id || Auth::user()->role === 'admin', 403);

        $u = auth()->user();
        $signatureUrl = $u?->signature_path
            ? asset('storage/' . $u->signature_path)
            : null;

        return Inertia::render('Reports/PVReport', [
            // ✅ ADDED (necessary): keep compatibility with component that expects reportId
            'reportId' => $report->getKey(),

            'report' => $report,          // ✅ keep your existing prop
            'mode' => 'edit',             // optional
            'signatureUrl' => $signatureUrl,
        ]);
    }
}
