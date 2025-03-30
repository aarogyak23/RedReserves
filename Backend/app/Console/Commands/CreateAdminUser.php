<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $email = 'admin@redreserve.com';
            $user = User::where('email', $email)->first();

            if ($user) {
                // Update existing user to be admin
                $user->update([
                    'is_admin' => true,
                    'password' => Hash::make('admin123')
                ]);
                Log::info('Existing user updated to admin:', ['email' => $email]);
            } else {
                // Create new admin user
                $user = User::create([
                    'name' => 'Admin',
                    'last_name' => 'User',
                    'email' => $email,
                    'password' => Hash::make('admin123'),
                    'blood_group' => 'O+',
                    'is_admin' => true,
                    'is_organization' => false
                ]);
                Log::info('New admin user created:', ['email' => $email]);
            }

            $this->info('Admin user setup completed successfully!');
            $this->info('Email: ' . $email);
            $this->info('Password: admin123');
            $this->info('Is Admin: ' . ($user->is_admin ? 'Yes' : 'No'));

        } catch (\Exception $e) {
            Log::error('Failed to create/update admin user: ' . $e->getMessage());
            $this->error('Failed to create/update admin user: ' . $e->getMessage());
        }
    }
}
