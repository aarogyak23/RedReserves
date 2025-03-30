<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\OrganizationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:50',
                'last_name' => 'required|string|max:50',
                'blood_group' => 'required|string|max:50',
                'email' => 'required|string|email|max:50|unique:users',
                'password' => 'required|string|min:6',
                'confirm_password' => 'required|string|same:password',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'last_name' => $request->last_name,
                'blood_group' => $request->blood_group,
                'email' => $request->email,
                'password' => Hash::make($request->password)
            ]);

            return response()->json([
                'status' => true,
                'message' => 'User registered successfully',
                'user' => $user
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find user by email
            $user = User::where('email', $request->email)->first();

            // Check if user exists and password matches
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid email or password'
                ], 401);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }
            return response()->json($user);
        } catch (\Exception $e) {
            \Log::error('Error fetching user profile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            // Log the incoming request data
            \Log::info('Profile update request data', ['data' => $request->all()]);
            \Log::info('Request headers', ['headers' => $request->headers->all()]);
            \Log::info('Request content type', ['content_type' => $request->header('Content-Type')]);

            // Validate the request data
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $user->id,
                'phone_number' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'blood_group' => 'required|string|max:10',
                'current_password' => 'nullable|required_with:new_password',
                'new_password' => 'nullable|min:8|confirmed',
                'profile_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            // Handle password update if provided
            if (!empty($request->current_password)) {
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'message' => 'Current password is incorrect'
                    ], 422);
                }
                $user->password = Hash::make($request->new_password);
            }

            // Handle profile image upload if provided
            if ($request->hasFile('profile_image')) {
                try {
                    \Log::info('Processing profile image upload');
                    
                    // Delete old profile picture if exists
                    if ($user->profile_picture) {
                        \Log::info('Deleting old profile picture', ['path' => $user->profile_picture]);
                        Storage::disk('public')->delete($user->profile_picture);
                    }
                    
                    // Store the new profile image
                    $path = $request->file('profile_image')->store('profile-images', 'public');
                    \Log::info('New profile image stored', ['path' => $path]);
                    $user->profile_picture = $path;
                } catch (\Exception $e) {
                    \Log::error('Error handling profile image', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json([
                        'message' => 'Error uploading profile image',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            // Remove password and image fields from validated data
            unset($validated['current_password']);
            unset($validated['new_password']);
            unset($validated['new_password_confirmation']);
            unset($validated['profile_image']);

            // Update user data
            $user->fill($validated);
            $user->save();

            // Add the full URL for the profile image
            $user->profile_image_url = $user->profile_picture ? Storage::url($user->profile_picture) : null;

            \Log::info('Profile updated successfully', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);
        } catch (ValidationException $e) {
            \Log::error('Validation error in profile update', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating profile', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error updating profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function submitOrganizationRequest(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'organization_name' => 'required|string|max:255',
                'organization_address' => 'required|string|max:255',
                'organization_phone' => 'required|string|max:20',
                'pancard_image' => 'required|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            // Store the PAN card image
            if ($request->hasFile('pancard_image')) {
                $path = $request->file('pancard_image')->store('pancards', 'public');
                $validated['pancard_image_path'] = $path;
            }

            // Create organization request
            $orgRequest = $user->organizationRequests()->create([
                'organization_name' => $validated['organization_name'],
                'organization_address' => $validated['organization_address'],
                'organization_phone' => $validated['organization_phone'],
                'pancard_image_path' => $validated['pancard_image_path'],
                'status' => 'pending'
            ]);

            return response()->json([
                'message' => 'Organization request submitted successfully',
                'request' => $orgRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error submitting organization request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getOrganizationStatus(Request $request)
    {
        try {
            $user = $request->user();
            $orgRequest = $user->organizationRequests()
                ->latest()
                ->first();

            return response()->json([
                'request' => $orgRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching organization status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
