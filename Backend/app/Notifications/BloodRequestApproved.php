<?php

namespace App\Notifications;

use App\Models\BloodRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BloodRequestApproved extends Notification implements ShouldQueue
{
    use Queueable;

    protected $bloodRequest;

    public function __construct(BloodRequest $bloodRequest)
    {
        $this->bloodRequest = $bloodRequest;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        \Log::info('Creating notification data:', [
            'blood_request_id' => $this->bloodRequest->id,
            'blood_group' => $this->bloodRequest->blood_group,
            'requester_name' => $this->bloodRequest->first_name . ' ' . $this->bloodRequest->last_name,
            'user_id' => $notifiable->id
        ]);

        $requesterName = $this->bloodRequest->first_name . ' ' . $this->bloodRequest->last_name;
        $data = [
            'message' => "{$requesterName} has requested blood {$this->bloodRequest->blood_group} urgently",
            'blood_request_id' => $this->bloodRequest->id,
            'blood_group' => $this->bloodRequest->blood_group,
            'requester_name' => $requesterName,
            'url' => '/blood-requests',
            'request_date' => $this->bloodRequest->created_at->format('Y-m-d H:i:s')
        ];

        \Log::info('Notification data created:', $data);

        // Create the notification in the database
        $notification = $notifiable->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => get_class($this),
            'data' => json_encode($data),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        \Log::info('Notification saved to database:', [
            'notification_id' => $notification->id,
            'user_id' => $notifiable->id
        ]);

        return $data;
    }
} 