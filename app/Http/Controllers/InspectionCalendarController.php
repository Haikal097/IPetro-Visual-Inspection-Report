<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\InspectionReminderNotification;

class InspectionCalendarController extends Controller
{
    public function index()
    {
        return Inertia::render('Calendar/InspectionCalendar');
    }

    /**
     * FullCalendar loads events using fetch("/inspection-calendar/events")
     * This must return JSON (not Inertia).
     */
    public function events(Request $request)
    {
        $userId = $request->user()->id;

        $events = Inspection::where('user_id', $userId)
            ->orderBy('start_at')
            ->get()
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'title' => $i->title,
                    'start' => optional($i->start_at)->toIso8601String(),
                    'end' => optional($i->end_at)->toIso8601String(),
                    'extendedProps' => [
                        'tag' => $i->tag,
                        'location' => $i->location,
                        'notes' => $i->notes,
                        'status' => $i->status,
                        'remind_1d' => (bool) $i->remind_1d,
                        'remind_1h' => (bool) $i->remind_1h,
                    ],
                ];
            });

        return response()->json($events);
    }

    /**
     * Inertia router.post() expects an Inertia response (redirect/back),
     * so DO NOT return JSON here.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],

            // Frontend sends "start_at" & "end_at" (datetime-local)
            'start_at' => ['required', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],

            'remind_1d' => ['sometimes', 'boolean'],
            'remind_1h' => ['sometimes', 'boolean'],
        ]);

        $inspection = Inspection::create([
            ...$data,
            'user_id' => $request->user()->id,
            'status' => 'planned',
        ]);

        // ✅ Schedule created notification
        $request->user()->notify(new InspectionReminderNotification([
            'type' => 'inspection_schedule_created',
            'inspection_id' => $inspection->id,
            'title' => "Inspection scheduled: {$inspection->title} ✅",
            'start_at' => optional($inspection->start_at)->toDateTimeString(),
            'tag' => $inspection->tag,
            'location' => $inspection->location,
        ]));

        return back()->with('success', 'Inspection created.');
    }

    public function update(Request $request, Inspection $inspection)
    {
        abort_unless($inspection->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],

            'start_at' => ['required', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],

            'status' => ['required', 'in:planned,in_progress,completed,cancelled'],
            'remind_1d' => ['sometimes', 'boolean'],
            'remind_1h' => ['sometimes', 'boolean'],
        ]);

        // ✅ Only reset reminder flags if time actually changed
        $timeChanged =
            ($inspection->start_at?->format('Y-m-d H:i:s') !== \Carbon\Carbon::parse($data['start_at'])->format('Y-m-d H:i:s'))
            || (
                ($inspection->end_at?->format('Y-m-d H:i:s') ?? null) !==
                ($data['end_at'] ? \Carbon\Carbon::parse($data['end_at'])->format('Y-m-d H:i:s') : null)
            );

        $updatePayload = [
            ...$data,
        ];

        if ($timeChanged) {
            $updatePayload['reminded_1d_at'] = null;
            $updatePayload['reminded_1h_at'] = null;
        }

        $inspection->update($updatePayload);

        return back()->with('success', 'Inspection updated.');
    }

    public function destroy(Request $request, Inspection $inspection)
    {
        abort_unless($inspection->user_id === $request->user()->id, 403);

        $inspection->delete();

        return back()->with('success', 'Inspection deleted.');
    }
}
