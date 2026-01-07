<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InspectorAiController extends Controller
{
    public function chat(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'message' => 'required|string|max:5000',
            'context' => 'nullable|array',  // optional extra data
        ]);

        $user = Auth::user();
        $context = $data['context'] ?? [];

        // System-style instruction (Gemini doesn't have "system", so we prepend)
        $prompt = "You are iPETRO Inspector Assistant.\n"
            . "Help the inspector write inspection reports, explain steps, suggest wording, check compliance, and answer questions.\n"
            . "Be concise, actionable, and use bullet points when helpful.\n\n"
            . "User: {$user->name}\n"
            . "Context(JSON): " . json_encode($context) . "\n\n"
            . "Inspector message:\n{$data['message']}";

        $reply = $gemini->generateText($prompt);

        return response()->json([
            'success' => true,
            'reply' => $reply,
        ]);
    }

    public function analyze(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'reports' => 'required|array',
            'question' => 'nullable|string|max:2000', // optional specific question
        ]);

        $question = $data['question'] ?? 'Give insights, trends, anomalies, and recommendations.';
        $reports = $data['reports'];

        // Keep prompt structured so output becomes readable
        $prompt =
            "You are iPETRO Report Analytics AI.\n"
            . "Given a list of inspection reports, produce a clear analysis:\n"
            . "1) Summary metrics (counts by status, weekly trend)\n"
            . "2) Notable patterns/anomalies\n"
            . "3) Operational suggestions (what to do next)\n"
            . "4) Risks / compliance reminders (if any)\n"
            . "Return in markdown with headings.\n\n"
            . "Question from user: {$question}\n\n"
            . "Reports JSON:\n" . json_encode($reports);

        $result = $gemini->generateText($prompt);

        return response()->json([
            'success' => true,
            'analysis' => $result,
        ]);
    }
}
