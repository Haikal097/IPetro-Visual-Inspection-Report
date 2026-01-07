<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReportRejected extends Notification
{
    use Queueable;

    public function __construct(
        public Report $report,
        public ?string $reason,
        public $actor = null // reviewer
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'report_rejected',
            'report_id' => $this->report->getKey(),
            'title' => $this->report->title,
            'status' => $this->report->status,
            'message' => $this->reason ?: 'Report was rejected.',
            'actor_id' => $this->actor?->id,
            'actor_name' => $this->actor?->name,
            'url' => "/reports", // or "/pv-report/{id}"
            'created_at' => now()->toDateTimeString(),
        ];
    }
}
