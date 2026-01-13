<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\InspectionReminderNotification;
use Carbon\Carbon;

class AdminInspectionController extends Controller
{
    public function index(Request $request)
    {
        $inspectors = User::where('role', 'inspector')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // default selected inspector (first one)
        $defaultInspectorId = $inspectors->first()?->id;

        return Inertia::render('Admin/InspectionScheduler', [
            'inspectors' => $inspectors,
            'defaultInspectorId' => $defaultInspectorId,
        ]);
    }

    /**
     * FullCalendar loads events using fetch("/admin/inspection-scheduler/events?assigned_to=ID")
     * Must return JSON.
     */
    public function events(Request $request)
    {
        $assignedTo = $request->query('assigned_to');

        $q = Inspection::query()->orderBy('start_at');

        // filter by inspector if provided
        if ($assignedTo) {
            $q->where(function ($w) use ($assignedTo) {
                $w->where('assigned_to', $assignedTo)
                  ->orWhere('user_id', $assignedTo); // fallback for older records
            });
        }

        $events = $q->get()->map(function ($i) {
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
                    'assigned_to' => $i->assigned_to,
                ],
            ];
        });

        return response()->json($events);
    }

    /**
     * Create schedule + notify inspector
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'assigned_to' => ['required', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'start_at' => ['required', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'remind_1d' => ['sometimes', 'boolean'],
            'remind_1h' => ['sometimes', 'boolean'],
        ]);

        $inspection = Inspection::create([
            ...$data,
            'created_by' => $request->user()->id,
            'user_id' => $data['assigned_to'], // backward compatibility
            'status' => 'planned',
        ]);

        $inspector = User::findOrFail($data['assigned_to']);

        $inspector->notify(new InspectionReminderNotification([
            'type' => 'inspection_assigned',
            'inspection_id' => $inspection->id,
            'title' => "New inspection assigned: {$inspection->title}",
            'start_at' => optional($inspection->start_at)->toDateTimeString(),
            'tag' => $inspection->tag,
            'location' => $inspection->location,
            'message' => 'Open Calendar to view details and start the job.',
            'url' => "/inspection-calendar?inspection={$inspection->id}",
        ]));

        return back()->with('success', 'Inspection assigned to inspector.');
    }

    public function update(Request $request, Inspection $inspection)
    {
        $data = $request->validate([
            'assigned_to' => ['required', 'exists:users,id'],
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

        $oldAssigned = $inspection->assigned_to ?? $inspection->user_id;

        $timeChanged =
            ($inspection->start_at?->format('Y-m-d H:i:s') !== Carbon::parse($data['start_at'])->format('Y-m-d H:i:s'))
            || (
                ($inspection->end_at?->format('Y-m-d H:i:s') ?? null) !==
                ($data['end_at'] ? Carbon::parse($data['end_at'])->format('Y-m-d H:i:s') : null)
            );

        $updatePayload = [
            ...$data,
            'user_id' => $data['assigned_to'], // backward compatibility
        ];

        if ($timeChanged) {
            $updatePayload['reminded_1d_at'] = null;
            $updatePayload['reminded_1h_at'] = null;
            $updatePayload['overdue_notified_at'] = null; // if you added this column
        }

        $inspection->update($updatePayload);

        // notify when reassigned OR rescheduled
        $newAssigned = $inspection->assigned_to ?? $inspection->user_id;

        if ((int)$oldAssigned !== (int)$newAssigned || $timeChanged) {
            $inspector = User::find($newAssigned);
            if ($inspector) {
                $inspector->notify(new InspectionReminderNotification([
                    'type' => 'inspection_updated',
                    'inspection_id' => $inspection->id,
                    'title' => "Inspection updated: {$inspection->title}",
                    'start_at' => optional($inspection->start_at)->toDateTimeString(),
                    'tag' => $inspection->tag,
                    'location' => $inspection->location,
                    'message' => (int)$oldAssigned !== (int)$newAssigned
                        ? 'You have been assigned to this inspection.'
                        : 'Schedule time has been updated.',
                    'url' => "/inspection-calendar?inspection={$inspection->id}",
                ]));
            }
        }

        return back()->with('success', 'Inspection updated.');
    }

    public function destroy(Request $request, Inspection $inspection)
    {
        $inspection->delete();
        return back()->with('success', 'Inspection deleted.');
    }
}
