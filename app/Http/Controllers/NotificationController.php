<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'unread' => $user->unreadNotifications()->latest()->take(10)->get()->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->data['type'] ?? 'notification',
                'title' => $n->data['title'] ?? 'Notification',
                'inspection_id' => $n->data['inspection_id'] ?? null,
                'start_at' => $n->data['start_at'] ?? null,
                'tag' => $n->data['tag'] ?? null,
                'location' => $n->data['location'] ?? null,
                'created_at' => $n->created_at?->toIso8601String(),
            ]),
            'recent' => $user->notifications()->latest()->take(10)->get()->map(fn($n) => [
                'id' => $n->id,
                'read_at' => optional($n->read_at)->toIso8601String(),
                'type' => $n->data['type'] ?? 'notification',
                'title' => $n->data['title'] ?? 'Notification',
                'inspection_id' => $n->data['inspection_id'] ?? null,
                'created_at' => $n->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        $n = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $n->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['ok' => true]);
    }
}
