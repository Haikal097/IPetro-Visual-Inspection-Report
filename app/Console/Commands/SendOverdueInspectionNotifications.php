<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inspection;
use App\Models\User;
use App\Notifications\InspectionReminderNotification;

class SendOverdueInspectionNotifications extends Command
{
    protected $signature = 'inspections:notify-overdue';
    protected $description = 'Notify inspectors about overdue inspections';

    public function handle(): int
    {
        $now = now();

        $overdue = Inspection::whereIn('status', ['planned','in_progress'])
            ->where('start_at', '<', $now)
            ->whereNull('overdue_notified_at')
            ->get();

        foreach ($overdue as $i) {
            $inspectorId = $i->assigned_to ?? $i->user_id;
            if (!$inspectorId) continue;

            $inspector = User::find($inspectorId);
            if (!$inspector) continue;

            $inspector->notify(new InspectionReminderNotification([
                'type' => 'inspection_overdue',
                'inspection_id' => $i->id,
                'title' => "⚠ Overdue: {$i->title}",
                'start_at' => optional($i->start_at)->toDateTimeString(),
                'tag' => $i->tag,
                'location' => $i->location,
                'message' => 'This inspection is past its scheduled time. Please update the status or reschedule.',
                'url' => "/inspection-calendar?inspection={$i->id}",
            ]));

            $i->update(['overdue_notified_at' => $now]);
        }

        $this->info("Overdue notifications sent: " . $overdue->count());
        return self::SUCCESS;
    }
}
