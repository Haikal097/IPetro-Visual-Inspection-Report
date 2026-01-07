<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AiDashboardAnalysisService;

class AiDashboardAnalysisController extends Controller
{
    public function __invoke(Request $request, AiDashboardAnalysisService $service)
    {
        $data = $request->validate([
            'stats.total' => 'required|integer',
            'stats.draft' => 'required|integer',
            'stats.submitted' => 'required|integer',
            'stats.inReview' => 'required|integer',
            'stats.completed' => 'required|integer',
            'range' => 'nullable|string|max:20',
            'chart.labels' => 'nullable|array',
            'chart.created' => 'nullable|array',
            'chart.completed' => 'nullable|array',
        ]);

        return response()->json($service->analyze($data));
    }
}
