<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AiChatSession;
use App\Models\AiChatMessage;

class AiInspectorChatHistoryController extends Controller
{
    // GET /api/ai/inspector-chat/sessions
    public function sessions(Request $request)
    {
        $userId = $request->user()->id;

        $sessions = AiChatSession::query()
            ->where('user_id', $userId)
            ->orderByDesc('last_message_at')
            ->select(['id', 'title', 'provider', 'model', 'status', 'last_message_at', 'created_at'])
            ->limit(30)
            ->get();

        return response()->json([
            'ok' => true,
            'sessions' => $sessions,
        ]);
    }

    // GET /api/ai/inspector-chat/sessions/{session}
    public function messages(Request $request, $session)
    {
        $userId = $request->user()->id;

        $chat = AiChatSession::query()
            ->where('id', $session)
            ->where('user_id', $userId)
            ->firstOrFail();

        $messages = AiChatMessage::query()
            ->where('session_id', $chat->id)
            ->orderBy('id')
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json([
            'ok' => true,
            'session' => $chat,
            'messages' => $messages,
        ]);
    }

    // DELETE /api/ai/inspector-chat/sessions/{session}
    public function delete(Request $request, $session)
    {
        $userId = $request->user()->id;

        $chat = AiChatSession::query()
            ->where('id', $session)
            ->where('user_id', $userId)
            ->firstOrFail();

        // delete messages first if FK not cascade
        AiChatMessage::where('session_id', $chat->id)->delete();
        $chat->delete();

        return response()->json(['ok' => true]);
    }
}
