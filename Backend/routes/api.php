<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BloodRequestController;
use App\Http\Controllers\UserController;
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
Route::post("/register", [AuthController::class, "register"]);
Route::post("/login", [AuthController::class, "login"]);

// User routes with auth:sanctum
Route::middleware("auth:sanctum")->group(function () {
    Route::get("/profile", [UserController::class, "getProfile"]);
    Route::put("/profile", [UserController::class, "updateProfile"]);
    Route::post("/organization/request", [UserController::class, "submitOrganizationRequest"]);
    Route::get("/organization/status", [UserController::class, "getOrganizationStatus"]);

    // Blood request routes
    Route::post("/blood-requests", [BloodRequestController::class, "store"]);
    Route::get("/blood-requests", [BloodRequestController::class, "index"]);

    // Notification routes
    Route::get('/notifications', [BloodRequestController::class, 'getNotifications']);
    Route::post('/notifications/{id}/read', [BloodRequestController::class, 'markNotificationAsRead']);

    // Admin routes
    Route::middleware('admin')->group(function () {
        Route::post('/blood-requests/{bloodRequest}/approve', [BloodRequestController::class, 'approve']);
    });
});

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::post('login', [AdminController::class, 'login']);
    
    Route::middleware('auth:admin')->group(function () {
        Route::get('users', [AdminController::class, 'getUsers']);
        Route::get('blood-requests', [AdminController::class, 'getBloodRequests']);
        Route::get('organization-requests', [AdminController::class, 'getOrganizationRequests']);
        Route::put('blood-requests/{id}/status', [AdminController::class, 'updateBloodRequestStatus']);
        Route::put('organization-requests/{id}/status', [AdminController::class, 'updateOrganizationRequestStatus']);
    });
});

// Organization search route
Route::middleware('auth:sanctum')->get('/organizations/search', [AdminController::class, 'searchOrganizations']);
