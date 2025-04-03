<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BloodRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $bloodRequest;

    public function __construct($bloodRequest)
    {
        $this->bloodRequest = $bloodRequest;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "{$this->bloodRequest->first_name} {$this->bloodRequest->last_name} has requested blood {$this->bloodRequest->blood_group} urgently",
            'blood_request_id' => $this->bloodRequest->id,
            'blood_group' => $this->bloodRequest->blood_group,
            'requester_name' => "{$this->bloodRequest->first_name} {$this->bloodRequest->last_name}",
            'url' => '/blood-requests',
            'type' => 'blood_request',
            'created_at' => now()->toISOString()
        ];
    }
} 