<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationRequest extends Model
{
    use HasFactory;

    protected $table = 'organization_requests';

    protected $fillable = [
        'user_id',
        'organization_name',
        'organization_address',
        'organization_phone',
        'pancard_image_path',
        'status',
        'rejection_reason'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
} 