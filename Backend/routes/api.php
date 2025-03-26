<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BloodRequestController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public routes
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::post('login', [AdminController::class, 'login']);
    
    Route::middleware('auth:admin')->group(function () {
        Route::get('users', [AdminController::class, 'getUsers']);
        Route::get('blood-requests', [AdminController::class, 'getBloodRequests']);
        Route::put('blood-requests/{id}/status', [AdminController::class, 'updateBloodRequestStatus']);
    });
});

// User routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Blood Request Routes
    Route::post('/blood-requests', [BloodRequestController::class, 'store']);
    Route::get('/blood-requests', [BloodRequestController::class, 'index']);
});
