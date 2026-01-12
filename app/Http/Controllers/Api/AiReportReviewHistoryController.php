<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AiReportReview;

class AiReportReviewHistoryController extends Controller
{
    // GET /api/ai/report-review-history?report_id=14
    public function index(Request $request)
    {
        $data = $request->validate([
            'report_id' => 'nullable|integer',
        ]);

        $q = AiReportReview::query()
            ->where('user_id', auth()->id())
            ->orderByDesc('id');

        if (!empty($data['report_id'])) {
            $q->where('report_id', $data['report_id']);
        }

        return response()->json([
            'ok' => true,
            'items' => $q->limit(30)->get([
                'id',
                'report_id',
                'provider',
                'model',
                'status',
                'created_at',
                'output_review',
            ]),
        ]);
    }

    // GET /api/ai/report-review-history/{id}
    public function show(int $id)
    {
        $row = AiReportReview::where('user_id', auth()->id())->findOrFail($id);

        return response()->json([
            'ok' => true,
            'item' => $row,
        ]);
    }

    // DELETE /api/ai/report-review-history/{id}
    public function destroy(int $id)
    {
        $row = AiReportReview::where('user_id', auth()->id())->findOrFail($id);
        $row->delete();

        return response()->json(['ok' => true]);
    }
}
