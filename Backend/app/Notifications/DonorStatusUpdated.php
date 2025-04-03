<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class DonorStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $bloodRequest;
    protected $donor;
    protected $message;

    public function __construct($bloodRequest, $donor, $message)
    {
        $this->bloodRequest = $bloodRequest;
        $this->donor = $donor;
        $this->message = $message;

        // Log notification creation
        Log::info('Creating donor status updated notification', [
            'blood_request_id' => $bloodRequest->id,
            'donor_id' => $donor->id,
            'donor_name' => $donor->name,
            'status' => $donor->status
        ]);
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        $title = $this->donor->status === 'approved' 
            ? 'Donation Offer Approved' 
            : 'Donation Offer Rejected';

        $data = [
            'title' => $title,
            'message' => $this->message,
            'blood_request_id' => $this->bloodRequest->id,
            'donor_id' => $this->donor->id,
            'blood_group' => $this->bloodRequest->blood_group,
            'status' => $this->donor->status,
            'remarks' => $this->donor->admin_remarks,
            'url' => "/blood-requests/{$this->bloodRequest->id}/donors",
            'type' => 'donor_status_updated',
            'created_at' => now()->toISOString()
        ];

        // Log notification data
        Log::info('Sending donor status updated notification', [
            'notifiable_id' => $notifiable->id,
            'notifiable_type' => get_class($notifiable),
            'notification_data' => $data
        ]);

        return $data;
    }
} 