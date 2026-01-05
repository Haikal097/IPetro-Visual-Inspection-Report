<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiReportDraftService;
use App\Models\AiReportDraft;

class AiReportDraftController extends Controller
{
    public function generatePv(Request $request, AiReportDraftService $service)
    {
        $data = $request->validate([
            'equipmentTag' => 'nullable|string|max:100',
            'equipmentType' => 'nullable|string|max:80',
            'plantUnitArea' => 'nullable|string|max:120',
            'doshRegistration' => 'nullable|string|max:120',
            'reportNo' => 'nullable|string|max:120',
            'reportDate' => 'nullable|string|max:30',

            'initialFinding' => 'nullable|string|max:8000',
            'externalFinding' => 'nullable|string|max:12000',
            'internalFinding' => 'nullable|string|max:12000',
            'ndt' => 'nullable|string|max:8000',
            'recommendations' => 'nullable|string|max:8000',

            // optional link to reports table
            'report_id' => 'nullable|integer',
        ]);

        try {
            $result = $service->generate($data);

            // ✅ Save if AI success
            if (($result['ok'] ?? false) === true) {
                $row = AiReportDraft::create([
                    'user_id'       => auth()->id(),
                    'report_id'     => $data['report_id'] ?? null,
                    'provider'      => config('services.gemini.provider', 'gemini'), // or 'openai'
                    'model'         => config('services.gemini.model', 'gemini-1.5-flash'),
                    'status'        => 'generated',
                    'input_payload' => $data,
                    'output_draft'  => $result['draft'] ?? [],
                ]);

                // Return draft_id for frontend
                $result['draft_id'] = $row->id;
            }

            return response()->json($result);

        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => 'AI draft generation failed.',
                'details' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
