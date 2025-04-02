<?php

namespace App\Notifications;

use App\Models\BloodRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BloodRequestRejected extends Notification implements ShouldQueue
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
        \Log::info('Creating rejection notification data:', [
            'blood_request_id' => $this->bloodRequest->id,
            'blood_group' => $this->bloodRequest->blood_group,
            'user_id' => $notifiable->id
        ]);

        $data = [
            'message' => "Your blood request for {$this->bloodRequest->blood_group} blood group has been rejected.",
            'blood_request_id' => $this->bloodRequest->id,
            'blood_group' => $this->bloodRequest->blood_group,
            'rejection_reason' => $this->bloodRequest->admin_remarks,
            'request_date' => $this->bloodRequest->created_at->format('Y-m-d H:i:s')
        ];

        \Log::info('Rejection notification data created:', $data);

        // Create the notification in the database
        $notification = $notifiable->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => get_class($this),
            'data' => json_encode($data),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        \Log::info('Rejection notification saved to database:', [
            'notification_id' => $notification->id,
            'user_id' => $notifiable->id
        ]);

        return $data;
    }
} 