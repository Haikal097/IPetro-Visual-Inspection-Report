<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Illuminate\Http\Request;
use Inertia\Inertia;


class InspectionCalendarController extends Controller
{
    public function index()
    {
        return Inertia::render('Calendar/InspectionCalendar');
    }

    public function events(Request $request)
    {
        $userId = $request->user()->id;

        $events = Inspection::where('user_id', $userId)
            ->orderBy('start_at')
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'title' => $i->title,
                'start' => $i->start_at->toIso8601String(),
                'end' => optional($i->end_at)->toIso8601String(),
                'extendedProps' => [
                    'tag' => $i->tag,
                    'location' => $i->location,
                    'notes' => $i->notes,
                    'status' => $i->status,
                    'remind_1d' => $i->remind_1d,
                    'remind_1h' => $i->remind_1h,
                ],
            ]);

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'tag' => ['nullable','string','max:255'],
            'location' => ['nullable','string','max:255'],
            'notes' => ['nullable','string'],
            'start_at' => ['required','date'],
            'end_at' => ['nullable','date','after_or_equal:start_at'],
            'remind_1d' => ['boolean'],
            'remind_1h' => ['boolean'],
        ]);

        Inspection::create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        return back();
    }

    public function update(Request $request, Inspection $inspection)
    {
        abort_unless($inspection->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'tag' => ['nullable','string','max:255'],
            'location' => ['nullable','string','max:255'],
            'notes' => ['nullable','string'],
            'start_at' => ['required','date'],
            'end_at' => ['nullable','date','after_or_equal:start_at'],
            'status' => ['required','in:planned,in_progress,completed,cancelled'],
            'remind_1d' => ['boolean'],
            'remind_1h' => ['boolean'],
        ]);

        // if time changed, allow reminders again
        $inspection->update([
            ...$data,
            'reminded_1d_at' => null,
            'reminded_1h_at' => null,
        ]);

        return back();
    }

    public function destroy(Request $request, Inspection $inspection)
    {
        abort_unless($inspection->user_id === $request->user()->id, 403);
        $inspection->delete();
        return back();
    }
}
