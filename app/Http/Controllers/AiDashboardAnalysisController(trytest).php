<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiDashboardAnalysisService;
use App\Models\AiDashboardAnalysis;

class AiDashboardAnalysisController extends Controller
{
    public function analyze(Request $request, AiDashboardAnalysisService $service)
    {
        $data = $request->validate([
            'stats' => 'required|array',
            'chartFilter' => 'nullable|string',
            'reports' => 'nullable|array',
        ]);

        $result = $service->analyze($data);

        if (($result['ok'] ?? false) === true) {
            $row = AiDashboardAnalysis::create([
                'user_id' => auth()->id(),
                'provider' => 'gemini',
                'model' => config('gemini.model', 'gemini-2.5-flash'),
                'status' => 'generated',
                'input_payload' => $data,
                'output_payload' => $result['analysis'] ?? [],
            ]);

            $result['analysis_id'] = $row->id;
        }

        return response()->json($result, ($result['ok'] ?? false) ? 200 : 422);
    }
}
