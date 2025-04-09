<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Campaign;

class NewCampaignNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $campaign;

    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'campaign_id' => $this->campaign->id,
            'title' => $this->campaign->title,
            'message' => "New blood donation campaign: {$this->campaign->title}",
            'type' => 'campaign',
            'data' => [
                'campaign_id' => $this->campaign->id,
                'title' => $this->campaign->title,
                'start_date' => $this->campaign->start_date,
                'end_date' => $this->campaign->end_date,
                'location' => $this->campaign->location,
            ]
        ];
    }
} 