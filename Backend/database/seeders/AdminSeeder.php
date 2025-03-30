<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@redreserve.com',
            'password' => Hash::make('admin123'),
            'blood_group' => 'O+',
            'is_admin' => true,
            'is_organization' => false
        ]);
    }
} 