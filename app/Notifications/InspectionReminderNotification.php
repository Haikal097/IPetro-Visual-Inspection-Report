<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InspectionReminderNotification extends Notification
{
     use Queueable;

    public function __construct(public array $payload) {}

    public function via($notifiable): array
    {
        return ['database', 'mail']; // remove 'mail' if you don’t want email
    }

    public function toDatabase($notifiable): array
    {
        return $this->payload;
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Inspection Reminder')
            ->line($this->payload['title'])
            ->line('Start: '.$this->payload['start_at'])
            ->line('Tag: '.$this->payload['tag'])
            ->line('Location: '.$this->payload['location']);
    }
}
