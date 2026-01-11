<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AiReportReviewService;
use App\Models\AiReportReview;

class AiReportReviewController extends Controller
{
    public function __invoke(Request $request, AiReportReviewService $service)
    {
        $data = $request->validate([
            'report_id' => 'required|integer',
            'report' => 'required|array',
            'report.report_data' => 'nullable|array',
            'report.status' => 'nullable|string|max:50',
            'report.report_number' => 'nullable|string|max:120',
        ]);

        $payload = [
            'report_id' => $data['report_id'],
            'status' => $data['report']['status'] ?? null,
            'report_number' => $data['report']['report_number'] ?? null,
            'report_data' => $data['report']['report_data'] ?? null,
        ];

        $result = $service->analyze($payload);

        if (($result['ok'] ?? false) === true) {
            $row = AiReportReview::create([
                'user_id' => auth()->id(),
                'report_id' => $data['report_id'],
                'provider' => 'gemini',
                'model' => config('gemini.model', 'gemini-2.5-flash'),
                'status' => 'generated',
                'input_payload' => $payload,
                'output_review' => $result['review'] ?? [],
            ]);

            $result['review_id'] = $row->id;
        }

        return response()->json($result);
    }
}
