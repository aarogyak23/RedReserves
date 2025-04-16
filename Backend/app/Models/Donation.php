<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'request_id',
        'status',
        'donation_date',
        'notes'
    ];

    protected $casts = [
        'donation_date' => 'datetime'
    ];

    public function donor()
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function request()
    {
        return $this->belongsTo(BloodRequest::class, 'request_id');
    }
} 