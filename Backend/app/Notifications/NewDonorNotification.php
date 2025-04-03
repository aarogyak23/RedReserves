<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class NewDonorNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $bloodRequest;
    protected $donor;

    public function __construct($bloodRequest, $donor)
    {
        $this->bloodRequest = $bloodRequest;
        $this->donor = $donor;
        
        // Log notification creation
        Log::info('Creating new donor notification', [
            'blood_request_id' => $bloodRequest->id,
            'donor_id' => $donor->id,
            'donor_name' => $donor->name,
            'requester_id' => $bloodRequest->user_id
        ]);
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        $data = [
            'title' => 'New Donor Available',
            'message' => "{$this->donor->name} has volunteered to donate {$this->donor->blood_group} blood for your request",
            'blood_request_id' => $this->bloodRequest->id,
            'donor_id' => $this->donor->id,
            'donor_name' => $this->donor->name,
            'donor_blood_group' => $this->donor->blood_group,
            'donor_phone' => $this->donor->phone,
            'donor_email' => $this->donor->email,
            'donor_message' => $this->donor->message,
            'donor_status' => $this->donor->status,
            'url' => "/admin/blood-requests/{$this->bloodRequest->id}/donors",
            'actions' => [
                [
                    'label' => 'View Details',
                    'url' => "/admin/blood-requests/{$this->bloodRequest->id}/donors",
                    'method' => 'GET'
                ],
                [
                    'label' => 'Approve Donor',
                    'url' => "/blood-requests/{$this->bloodRequest->id}/donors/{$this->donor->id}/status",
                    'method' => 'PUT',
                    'data' => ['status' => 'approved']
                ],
                [
                    'label' => 'Reject Donor',
                    'url' => "/blood-requests/{$this->bloodRequest->id}/donors/{$this->donor->id}/status",
                    'method' => 'PUT',
                    'data' => ['status' => 'rejected']
                ]
            ],
            'type' => 'new_donor',
            'created_at' => now()->toISOString()
        ];

        // Log notification data
        Log::info('Sending new donor notification', [
            'notifiable_id' => $notifiable->id,
            'notifiable_type' => get_class($notifiable),
            'notification_data' => $data
        ]);

        return $data;
    }
} 