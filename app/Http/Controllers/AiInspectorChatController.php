<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\AiInspectorChatService;
use App\Models\AiChatSession;
use App\Models\AiChatMessage;

class AiInspectorChatController extends Controller
{
    public function chat(Request $request, AiInspectorChatService $service)
    {
        $data = $request->validate([
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|string|in:user,assistant',
            'messages.*.content' => 'required|string|max:8000',
            'context' => 'nullable|array',

            // ✅ allow frontend to continue an existing chat
            'session_id' => 'nullable|integer|exists:ai_chat_sessions,id',
            'title' => 'nullable|string|max:120',
        ]);

        // ✅ Find/create session
        $session = null;

        if (!empty($data['session_id'])) {
            $session = AiChatSession::where('id', $data['session_id'])
                ->where('user_id', auth()->id())
                ->first();
        }

        if (!$session) {
            $session = AiChatSession::create([
                'user_id' => auth()->id(),
                'title' => $data['title'] ?? 'Inspector Chat', // default
                'provider' => 'gemini',
                'model' => config('gemini.model', 'gemini-2.5-flash'),
                'status' => 'active',
                'context' => $data['context'] ?? null,
                'last_message_at' => now(),
            ]);
        }

        // ✅ decide if we should generate smart title later
        $needsSmartTitle = in_array($session->title, ['Inspector Chat', 'New chat'], true);

        // ✅ Save incoming messages (avoid duplicates: only save the latest user message)
        $last = end($data['messages']);
        $provisionalTitle = null;

        if (($last['role'] ?? null) === 'user') {
            AiChatMessage::create([
                'session_id' => $session->id,
                'role' => 'user',
                'content' => $last['content'],
            ]);

            // ✅ Optional: provisional title from first user message (nice UX)
            if (in_array($session->title, ['Inspector Chat', 'New chat'], true)) {
                $provisionalTitle = Str::limit(trim($last['content']), 60);
                if ($provisionalTitle !== '') {
                    $session->update([
                        'title' => $provisionalTitle,
                        'last_message_at' => now(),
                    ]);
                } else {
                    $session->update(['last_message_at' => now()]);
                }

                // even if we set provisional title, we STILL want smart title later
                $needsSmartTitle = true;
            } else {
                $session->update(['last_message_at' => now()]);
            }
        }

        // ✅ Call Gemini
        $result = $service->chat($data['messages'], $data['context'] ?? []);

        if (($result['ok'] ?? false) !== true) {
            return response()->json($result, 422);
        }

        // ✅ Save assistant reply
        AiChatMessage::create([
            'session_id' => $session->id,
            'role' => 'assistant',
            'content' => $result['reply'],
        ]);

        $session->update(['last_message_at' => now()]);

        // ✅ Auto-generate session title based on discussion topic (ONLY if default/provisional)
        // This runs even if we already set a provisional title from first user message.
        if ($needsSmartTitle) {
            $msgsForTitle = array_merge($data['messages'], [
                ['role' => 'assistant', 'content' => $result['reply']],
            ]);

            $t = $service->suggestTitle($msgsForTitle, $data['context'] ?? []);

            if (($t['ok'] ?? false) === true && !empty($t['title'])) {
                $session->update(['title' => $t['title']]);
            }
        }

        // return session_id so frontend can reuse it
        $result['session_id'] = $session->id;

        return response()->json($result);
    }
}
