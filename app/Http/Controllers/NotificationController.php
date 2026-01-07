<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use App\Notifications\InspectionReminderNotification;

class NotificationController extends Controller
{
            public function feed(Request $request)
        {
            $user = $request->user();
            $limit = (int) ($request->query('limit', 10));

            $map = function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->data['type'] ?? null,
                    'title' => $n->data['title'] ?? 'Notification',
                    'inspection_id' => $n->data['inspection_id'] ?? null,
                    'start_at' => $n->data['start_at'] ?? null,
                    'tag' => $n->data['tag'] ?? null,
                    'location' => $n->data['location'] ?? null,
                    'read_at' => $n->read_at,
                    'created_at' => optional($n->created_at)->toDateTimeString(),
                ];
            };

            $unread = $user->unreadNotifications()->latest()->take($limit)->get()->map($map);
            $recent = $user->notifications()->latest()->take($limit)->get()->map($map);

            return response()->json([
                'unread_count' => $user->unreadNotifications()->count(),
                'unread' => $unread,
                'recent' => $recent,
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
