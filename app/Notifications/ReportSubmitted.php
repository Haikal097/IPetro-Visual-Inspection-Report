<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReportSubmitted extends Notification
{
    use Queueable;

    public function __construct(
        public Report $report,
        public $actor = null // who triggered (inspector)
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
        {
            return [
                'type' => 'report_submitted',
                'report_id' => $this->report->getKey(),
                'title' => $this->report->title
                    ? "Report Submitted: {$this->report->title}"
                    : "Report Submitted",
                'status' => $this->report->status,
                'message' => 'Your report has been submitted for review.',
                'actor_id' => $this->actor?->id,
                'actor_name' => $this->actor?->name,
                'url' => "/reports/{$this->report->getKey()}",
                'created_at' => now()->toDateTimeString(),
            ];
        }

}
