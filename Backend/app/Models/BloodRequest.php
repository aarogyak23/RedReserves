<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'blood_group',
        'requisition_form_path',
        'status',
        'admin_remarks'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
