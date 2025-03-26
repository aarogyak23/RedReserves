<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class CreateAdminSeeder extends Seeder
{
    public function run()
    {
        Admin::create([
            'name' => 'System Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }
} 