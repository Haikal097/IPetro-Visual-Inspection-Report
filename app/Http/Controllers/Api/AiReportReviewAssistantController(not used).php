<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AiReportReviewAssistantService;

class AiReportReviewAssistantController extends Controller
{
    public function __invoke(Request $request, AiReportReviewAssistantService $service)
    {
        $data = $request->validate([
            'report' => 'required|array',
            'report.id' => 'nullable',
            'report.status' => 'nullable|string',
            'report.creation_date' => 'nullable|string',
            'report.submission_date' => 'nullable|string|nullable',
            'report.signed_at' => 'nullable|string|nullable',
            'report.title' => 'nullable|string',
            'report.json_data' => 'nullable', // can be string or array

            // optional - if you want reviewer to send extra notes
            'options' => 'nullable|array',
        ]);

        $result = $service->analyze($data['report'], $data['options'] ?? []);

        if (($result['ok'] ?? false) !== true) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }
}
