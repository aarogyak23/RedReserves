<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\BloodRequest;
use App\Models\OrganizationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Tag(
 *     name="Admin",
 *     description="API Endpoints for admin operations"
 * )
 */
class AdminController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/admin/login",
     *     tags={"Admin"},
     *     summary="Admin login",
     *     description="Login with email and password to get access token",
     *     operationId="adminLogin",
     *     @OA\RequestBody(
     *         required=true,
     *         description="Admin credentials",
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="admin@redreserves.com"),
     *             @OA\Property(property="password", type="string", format="password", example="admin123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string", example="1|abcdef123456..."),
     *             @OA\Property(property="message", type="string", example="Login successful")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="The provided credentials are incorrect.")
     *         )
     *     )
     * )
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                "email" => "required|email",
                "password" => "required",
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::where("email", $request->email)
                ->where("is_admin", true)
                ->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $token = $user->createToken("admin-token", ['admin'])->plainTextToken;

            return response()->json([
                'status' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Admin login error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'An error occurred during login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/admin/users",
     *     tags={"Admin"},
     *     summary="Get all users",
     *     description="Retrieve a list of all registered users",
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of users retrieved successfully",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="John"),
     *                 @OA\Property(property="last_name", type="string", example="Doe"),
     *                 @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *                 @OA\Property(property="blood_group", type="string", example="A+")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Error fetching users")
     *         )
     *     )
     * )
     */
    public function getUsers()
    {
        try {
            $users = User::select(
                'id',
                'name',
                'last_name',
                'email',
                'blood_group',
                'phone_number',
                'address',
                'city',
                'state',
                'country',
                'postal_code',
                'is_organization',
                'organization_name',
                'created_at'
            )
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'status' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error fetching users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/admin/blood-requests",
     *     tags={"Admin"},
     *     summary="Get all blood requests",
     *     description="Retrieve a list of all blood requests with requester details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of blood requests retrieved successfully",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="requester_name", type="string", example="John Doe"),
     *                 @OA\Property(property="blood_group", type="string", example="A+"),
     *                 @OA\Property(property="status", type="string", enum={"pending", "approved", "rejected"}, example="pending"),
     *                 @OA\Property(property="created_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Error fetching blood requests")
     *         )
     *     )
     * )
     */
    public function getBloodRequests()
    {
        try {
            $requests = BloodRequest::with('user')
                ->select(
                    'id',
                    'user_id',
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                    'address',
                    'date_of_birth',
                    'gender',
                    'requisition_form_path',
                    'status',
                    'admin_remarks',
                    'created_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching blood requests: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error fetching blood requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/admin/organization-requests",
     *     tags={"Admin"},
     *     summary="Get all organization requests",
     *     description="Retrieve a list of all organization requests with user details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of organization requests retrieved successfully",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="organization_name", type="string", example="Red Cross"),
     *                 @OA\Property(property="status", type="string", enum={"pending", "approved", "rejected"}, example="pending"),
     *                 @OA\Property(property="created_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Error fetching organization requests")
     *         )
     *     )
     * )
     */
    public function getOrganizationRequests()
    {
        try {
            $requests = OrganizationRequest::with('user')
                ->select(
                    'id',
                    'user_id',
                    'organization_name',
                    'organization_phone',
                    'organization_address',
                    'pancard_image_path',
                    'status',
                    'rejection_reason',
                    'created_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching organization requests: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error fetching organization requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/admin/blood-requests/{id}",
     *     tags={"Admin"},
     *     summary="Update blood request status",
     *     description="Update the status of a blood request",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Blood request ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(
     *                 property="status",
     *                 type="string",
     *                 enum={"pending", "approved", "rejected"},
     *                 example="approved"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Status updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Blood request status updated successfully"),
     *             @OA\Property(
     *                 property="request",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="status", type="string", example="approved")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Validation error"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Failed to update blood request status"),
     *             @OA\Property(property="error", type="string")
     *         )
     *     )
     * )
     */
    public function updateBloodRequestStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,approved,rejected',
                'admin_remarks' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $bloodRequest = BloodRequest::findOrFail($id);
            $oldStatus = $bloodRequest->status;
            
            $bloodRequest->update([
                'status' => $request->status,
                'admin_remarks' => $request->admin_remarks
            ]);

            // If the request was approved, send notifications to other users
            if ($request->status === 'approved' && $oldStatus !== 'approved') {
                \Log::info('Blood request approved, sending notifications:', [
                    'request_id' => $bloodRequest->id,
                    'admin_id' => Auth::id()
                ]);

                // Get all users except the one who made the request
                $users = User::where('id', '!=', $bloodRequest->user_id)->get();
                \Log::info('Found users to notify:', [
                    'count' => $users->count(),
                    'user_ids' => $users->pluck('id')->toArray()
                ]);

                // Send notification to all users
                $notificationCount = 0;
                foreach ($users as $user) {
                    try {
                        \Log::info('Attempting to send notification to user:', [
                            'user_id' => $user->id,
                            'user_email' => $user->email
                        ]);

                        // Create notification directly in the database
                        $requesterName = $bloodRequest->first_name . ' ' . $bloodRequest->last_name;
                        $notificationData = [
                            'message' => "{$requesterName} has requested blood {$bloodRequest->blood_group} urgently",
                            'blood_request_id' => $bloodRequest->id,
                            'blood_group' => $bloodRequest->blood_group,
                            'requester_name' => $requesterName,
                            'request_date' => $bloodRequest->created_at->format('Y-m-d H:i:s')
                        ];

                        $notification = $user->notifications()->create([
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'type' => \App\Notifications\BloodRequestApproved::class,
                            'data' => json_encode($notificationData),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        \Log::info('Notification created for user:', [
                            'user_id' => $user->id,
                            'notification_id' => $notification->id,
                            'notification_data' => $notificationData
                        ]);

                        $notificationCount++;
                    } catch (\Exception $e) {
                        \Log::error('Failed to send notification to user:', [
                            'user_id' => $user->id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }

                \Log::info('Notifications sent:', [
                    'request_id' => $bloodRequest->id,
                    'notifications_sent' => $notificationCount
                ]);
            }
            // If the request was rejected, send notification to the requester
            elseif ($request->status === 'rejected' && $oldStatus !== 'rejected') {
                \Log::info('Blood request rejected, sending notification to requester:', [
                    'request_id' => $bloodRequest->id,
                    'user_id' => $bloodRequest->user_id,
                    'admin_id' => Auth::id()
                ]);

                try {
                    // Get the user who made the request
                    $requester = $bloodRequest->user;
                    
                    // Create rejection notification directly in the database
                    $notificationData = [
                        'message' => "Your blood request for {$bloodRequest->blood_group} blood group has been rejected.",
                        'blood_request_id' => $bloodRequest->id,
                        'blood_group' => $bloodRequest->blood_group,
                        'rejection_reason' => $request->admin_remarks,
                        'request_date' => $bloodRequest->created_at->format('Y-m-d H:i:s')
                    ];

                    $notification = $requester->notifications()->create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'type' => \App\Notifications\BloodRequestRejected::class,
                        'data' => json_encode($notificationData),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    \Log::info('Rejection notification created for user:', [
                        'user_id' => $requester->id,
                        'notification_id' => $notification->id,
                        'notification_data' => $notificationData
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to send rejection notification:', [
                        'user_id' => $bloodRequest->user_id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Blood request status updated successfully',
                'data' => $bloodRequest
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating blood request status: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update blood request status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/admin/organization-requests/{id}/status",
     *     tags={"Admin"},
     *     summary="Update organization request status",
     *     description="Update the status of an organization request",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Organization request ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(
     *                 property="status",
     *                 type="string",
     *                 enum={"pending", "approved", "rejected"},
     *                 example="approved"
     *             ),
     *             @OA\Property(
     *                 property="rejection_reason",
     *                 type="string",
     *                 description="Reason for rejection if status is rejected",
     *                 example="Invalid documentation"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Status updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Organization request status updated successfully")
     *         )
     *     )
     * )
     */
    public function updateOrganizationRequestStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,approved,rejected',
                'rejection_reason' => 'nullable|string|required_if:status,rejected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $orgRequest = OrganizationRequest::findOrFail($id);
            
            // Update organization request status
            $orgRequest->update([
                'status' => $request->status,
                'rejection_reason' => $request->rejection_reason
            ]);

            // If approved, update user to organization
            if ($request->status === 'approved') {
                $orgRequest->user->update([
                    'is_organization' => true,
                    'organization_name' => $orgRequest->organization_name
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Organization request status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating organization request status: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update organization request status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateUser(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'phone_number' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'blood_group' => 'required|string|max:10',
            ]);

            $user->update($validated);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function convertToOrganization(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'organization_name' => 'required|string|max:255',
            ]);

            $user->update([
                'is_organization' => true,
                'organization_name' => $validated['organization_name'],
            ]);

            return response()->json([
                'message' => 'User converted to organization successfully',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error converting user to organization',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/organizations/search",
     *     tags={"Admin"},
     *     summary="Search organizations",
     *     description="Search and filter organizations by name or address",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Search term for organization name or address",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number for pagination",
     *         required=false,
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Number of items per page",
     *         required=false,
     *         @OA\Schema(type="integer", default=10)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Organizations retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="organization_name", type="string", example="Red Cross"),
     *                     @OA\Property(property="organization_phone", type="string", example="+1234567890"),
     *                     @OA\Property(property="organization_address", type="string", example="123 Main St")
     *                 )
     *             ),
     *             @OA\Property(property="last_page", type="integer", example=5)
     *         )
     *     )
     * )
     */
    public function searchOrganizations(Request $request)
    {
        try {
            \Log::info('Searching organizations with params:', [
                'search' => $request->search,
                'page' => $request->page,
                'per_page' => $request->per_page
            ]);

            // Start with organization requests that are approved
            $query = \App\Models\OrganizationRequest::where('status', 'approved');

            // Apply search filter if search term is provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                \Log::info('Applying search filter:', ['term' => $searchTerm]);
                
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('organization_name', 'like', "%{$searchTerm}%")
                      ->orWhere('organization_address', 'like', "%{$searchTerm}%");
                });
            }

            // Get paginated results with proper column selection
            $organizations = $query->select(
                'id',
                'organization_name',
                'organization_phone',
                'organization_address'
            )
            ->orderBy('organization_name')
            ->paginate($request->per_page ?? 10);

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
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to search organizations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 