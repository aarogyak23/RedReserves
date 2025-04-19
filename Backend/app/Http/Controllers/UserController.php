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

    public function show(Request $request)
    {
        try {
            $user = auth()->user();
            $userData = $user->toArray();
            
            // Add the full URL for profile picture if it exists
            if ($user->profile_picture) {
                $userData['profile_picture_url'] = asset('storage/' . $user->profile_picture);
                \Log::info('Profile picture URL in show: ' . $userData['profile_picture_url']);
            }

            return response()->json($userData);
        } catch (\Exception $e) {
            \Log::error('Error fetching user profile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch user profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            // Validate the request data - all fields are optional
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'phone_number' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'blood_group' => 'sometimes|string|max:10',
                'current_password' => 'nullable|required_with:new_password',
                'new_password' => 'nullable|min:8|confirmed'
            ]);

            // Handle password update if provided
            if (!empty($request->current_password)) {
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'message' => 'Current password is incorrect'
                    ], 422);
                }
                $user->password = Hash::make($request->new_password);
            }

            // Remove password fields from validated data
            unset($validated['current_password']);
            unset($validated['new_password']);
            unset($validated['new_password_confirmation']);

            // Update user data
            $user->fill($validated);
            $user->save();

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating profile: ' . $e->getMessage());
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

    public function getOrganizationDetails($id)
    {
        try {
            // Clean the ID by removing any text after colon
            $cleanId = explode(':', $id)[0];
            \Log::info('Fetching organization details for ID: ' . $cleanId);

            // First check if user exists
            $user = User::find($cleanId);
            if (!$user) {
                \Log::error('User not found with ID: ' . $cleanId);
                return response()->json(['message' => 'Organization not found'], 404);
            }

            // Then check if user is an organization
            if (!$user->is_organization) {
                \Log::error('User is not an organization. User ID: ' . $cleanId);
                return response()->json(['message' => 'User is not an organization'], 404);
            }

            $organization = User::where('id', $cleanId)
                ->where('is_organization', true)
                ->with(['bloodStocks' => function($query) {
                    $query->select('id', 'organization_id', 'blood_group', 'quantity', 'updated_at');
                }])
                ->select(
                    'id',
                    'organization_name',
                    'phone_number',
                    'address',
                    'email'
                )
                ->first();

            if (!$organization) {
                \Log::error('Organization not found after fetching details. User ID: ' . $cleanId);
                return response()->json(['message' => 'Organization not found'], 404);
            }

            \Log::info('Successfully fetched organization details', [
                'org_id' => $organization->id,
                'org_name' => $organization->organization_name,
                'blood_stocks_count' => $organization->bloodStocks->count()
            ]);

            return response()->json($organization);
        } catch (\Exception $e) {
            \Log::error('Error fetching organization details: ' . $e->getMessage(), [
                'id' => $id,
                'clean_id' => $cleanId ?? null,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error fetching organization details: ' . $e->getMessage()], 500);
        }
    }

    public function searchOrganizations(Request $request)
    {
        try {
            \Log::info('Searching organizations with params:', [
                'search' => $request->search,
                'page' => $request->page,
                'per_page' => $request->per_page
            ]);

            // Query users who are verified organizations
            $query = User::where('is_organization', 1)  // Only get verified organizations
                        ->whereNotNull('organization_name'); // Ensure organization name is set

            // Apply search filter if search term is provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                \Log::info('Applying search filter:', ['term' => $searchTerm]);
                
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('organization_name', 'like', "%{$searchTerm}%")
                      ->orWhere('organization_address', 'like', "%{$searchTerm}%")
                      ->orWhere('address', 'like', "%{$searchTerm}%");
                });
            }

            // Get paginated results with proper column selection
            $organizations = $query->select(
                'id',
                'organization_name',
                'phone_number',
                'organization_phone',
                'address',
                'organization_address',
                'email',
                'is_organization'
            )
            ->with(['bloodStocks' => function($query) {
                $query->select('id', 'organization_id', 'blood_group', 'quantity', 'updated_at');
            }])
            ->orderBy('organization_name')
            ->paginate($request->per_page ?? 10);

            // Log the results for debugging
            \Log::info('Organizations found:', [
                'count' => $organizations->count(),
                'total' => $organizations->total()
            ]);

            return response()->json([
                'status' => true,
                'data' => $organizations->items(),
                'current_page' => $organizations->currentPage(),
                'last_page' => $organizations->lastPage(),
                'total' => $organizations->total(),
                'per_page' => $organizations->perPage()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error searching organizations: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to search organizations'
            ], 500);
        }
    }
}
