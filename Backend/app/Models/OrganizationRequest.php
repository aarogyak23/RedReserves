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
        'organization_phone',
        'organization_address',
        'pancard_image_path',
        'status',
        'rejection_reason'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
} 