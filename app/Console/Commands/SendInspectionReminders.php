<?php

namespace App\Console\Commands;

use App\Models\Inspection;
use App\Notifications\InspectionReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
class SendInspectionReminders extends Command
{
    protected $signature = 'inspections:remind';
    protected $description = 'Send inspection reminders (1 day / 1 hour before)';

    public function handle(): int
{
    $now = now();
    $this->info("Running inspections:remind at " . $now);

    $inspections = Inspection::with('user')
        ->whereIn('status', ['planned','in_progress'])
        ->get();

    $this->info("Found inspections: " . $inspections->count());

    $sent = 0;

    


    foreach ($inspections as $i) {
        $start = Carbon::parse($i->start_at);

        

        // 1 day reminder
        if (
                $i->remind_1d &&
                !$i->reminded_1d_at &&
                $now->diffInMinutes($start, false) <= 1440 &&
                $now->diffInMinutes($start, false) > 0        

            ) {
                $i->user->notify(new InspectionReminderNotification([
                    'type' => 'inspection_reminder_1d',
                    'inspection_id' => $i->id,
                    'title' => "Tomorrow: {$i->title}",
                    'start_at' => $start->toDateTimeString(),
                    'tag' => $i->tag,
                    'location' => $i->location,
                ]));

                $i->update(['reminded_1d_at' => $now]);
            }


        // 1 hour reminder
        if (
                $i->remind_1h &&
                !$i->reminded_1h_at &&
                $now->diffInMinutes($start, false) <= 60 &&
                $now->diffInMinutes($start, false) > 0
            ) {
                $i->user->notify(new InspectionReminderNotification([
                    'type' => 'inspection_reminder_1h',
                    'inspection_id' => $i->id,
                    'title' => "In 1 hour: {$i->title}",
                    'start_at' => $start->toDateTimeString(),
                    'tag' => $i->tag,
                    'location' => $i->location,
                ]));

                $i->update(['reminded_1h_at' => $now]);
            }

    }

    $this->info("Sent notifications: " . $sent);
    return self::SUCCESS;
}

}
