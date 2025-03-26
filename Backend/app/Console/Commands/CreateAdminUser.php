<?php

namespace App\Console\Commands;

use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin {email?} {name?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?? $this->ask('What is the admin email?');
        $name = $this->argument('name') ?? $this->ask('What is the admin name?');
        $password = $this->secret('What is the admin password?');
        $confirmPassword = $this->secret('Confirm the password');

        // Validate input
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $confirmPassword,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admin_users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return 1;
        }

        try {
            Admin::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            $this->info('Admin user created successfully.');
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to create admin user: ' . $e->getMessage());
            return 1;
        }
    }
}
