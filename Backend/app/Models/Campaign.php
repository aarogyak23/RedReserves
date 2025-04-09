<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'location',
        'image_path',
        'admin_id',
        'status'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime'
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function interestedUsers()
    {
        return $this->belongsToMany(User::class, 'campaign_user', 'campaign_id', 'user_id')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function interests()
    {
        return $this->hasMany(CampaignInterest::class);
    }
} 