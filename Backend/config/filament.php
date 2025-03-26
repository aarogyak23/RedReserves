<?php

use App\Models\Admin;
use Filament\Panel;

return [
    'path' => env('FILAMENT_PATH', 'admin'),
    'domain' => env('FILAMENT_DOMAIN'),
    'home_url' => env('FILAMENT_HOME_URL', '/'),
    'brand_name' => env('FILAMENT_BRAND_NAME', 'RedReserve'),
    'auth' => [
        'guard' => 'admin',
        'pages' => [
            'login' => \Filament\Pages\Auth\Login::class,
        ],
    ],
    'middleware' => [
        'auth' => [
            \Filament\Http\Middleware\Authenticate::class,
        ],
        'base' => [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ],
    'auth_provider' => 'admins',
    'model' => Admin::class,
    // ... rest of the configuration
]; 