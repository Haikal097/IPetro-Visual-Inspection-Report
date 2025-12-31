<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Notifications\DatabaseNotification;
use App\Notifications\InspectionReminderNotification;

class NotificationController extends Controller
{
    public function feed(Request $request)
    {
        $user = $request->user();

        $limit = (int) ($request->query('limit', 10));

        $notifications = $user->notifications()
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->data['type'] ?? null,
                    'title' => $n->data['title'] ?? 'Notification',
                    'inspection_id' => $n->data['inspection_id'] ?? null,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at->toDateTimeString(),
                ];
            });

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        /** @var DatabaseNotification $notification */
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    }
    public function sendTest(Request $request)
    {
    $request->user()->notify(new InspectionReminderNotification([
        'type' => 'test_reminder',
        'inspection_id' => null,
        'title' => 'TEST REMINDER: Notification system is working ✅',
        'start_at' => now()->toDateTimeString(),
        'tag' => 'TEST',
        'location' => 'Dashboard',
    ]));

    return response()->json(['success' => true]);
    }

    public function stats(Request $request)
{
    $user = $request->user();

    return response()->json([
        'total' => $user->notifications()->count(),
        'unread' => $user->unreadNotifications()->count(),
        'today' => $user->notifications()->whereDate('created_at', now()->toDateString())->count(),
        'reminders_1h' => $user->notifications()->where('data->type', 'inspection_reminder_1h')->count(),
        'reminders_1d' => $user->notifications()->where('data->type', 'inspection_reminder_1d')->count(),
    ]);
}


}