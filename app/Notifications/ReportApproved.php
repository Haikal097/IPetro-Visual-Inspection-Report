<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReportApproved extends Notification
{
    use Queueable;

    public function __construct(
        public Report $report,
        public $actor = null // reviewer
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'report_approved',
            'report_id' => $this->report->getKey(),
            'title' => $this->report->title,
            'status' => $this->report->status,
            'message' => 'Your report has been approved.',
            'url' => "/pv-report/{$this->report->getKey()}",
            'created_at' => now()->toDateTimeString(),
        ];
    }
}
