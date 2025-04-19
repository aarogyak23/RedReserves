<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\BloodRequest;
use App\Models\BloodRequestDonor;
use App\Models\OrganizationRequest;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Notification;
use App\Notifications\NewCampaignNotification;
use Illuminate\Support\Facades\Storage;

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

            // Revoke all existing tokens
            $user->tokens()->delete();

            // Create new token with admin abilities
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
            Log::error('Admin login error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
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
            Log::info('Admin getUsers: Starting to fetch users list');
            
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
            ->where('is_admin', false)  // Exclude admin users
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'status' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Admin getUsers error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Error fetching users'
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
            Log::info('Admin getBloodRequests: Starting to fetch blood requests');
            
            $bloodRequests = BloodRequest::with(['user', 'donors'])
                ->select(
                    'id',
                    'user_id',
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                    'address',
                    'blood_group',
                    'status',
                    'admin_remarks',
                    'created_at',
                    'updated_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => true,
                'data' => $bloodRequests
            ]);
        } catch (\Exception $e) {
            Log::error('Admin getBloodRequests error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Error fetching blood requests'
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
            Log::info('Admin getOrganizationRequests: Starting to fetch organization requests');
            
            $orgRequests = OrganizationRequest::with('user')
                ->select(
                    'id',
                    'user_id',
                    'organization_name',
                    'organization_address',
                    'organization_phone',
                    'pancard_image_path',
                    'status',
                    'rejection_reason',
                    'created_at',
                    'updated_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => true,
                'data' => $orgRequests
            ]);
        } catch (\Exception $e) {
            Log::error('Admin getOrganizationRequests error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Error fetching organization requests'
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
            $orgRequest = OrganizationRequest::with('user')->findOrFail($id);
            $orgRequest->status = $request->status;
            $orgRequest->rejection_reason = $request->rejection_reason;
            $orgRequest->save();

            // If the request is approved, update the user's organization status
            if ($request->status === 'approved') {
                $user = $orgRequest->user;
                $user->update([
                    'is_organization' => true,
                    'organization_name' => $orgRequest->organization_name
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Organization request status updated successfully',
                'data' => $orgRequest
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating organization request status: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error updating organization request status',
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

            // Query users who are organizations
            $query = User::where('is_organization', true)
                        ->whereNotNull('organization_name'); // Ensure organization name is set

            // Apply search filter if search term is provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                \Log::info('Applying search filter:', ['term' => $searchTerm]);
                
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('organization_name', 'like', "%{$searchTerm}%")
                      ->orWhere('address', 'like', "%{$searchTerm}%");
                });
            }

            // Get paginated results with proper column selection
            $organizations = $query->select(
                'id',
                'organization_name',
                'phone_number',
                'address',
                'email'
            )
            ->with(['bloodStocks' => function($query) {
                $query->select('id', 'organization_id', 'blood_group', 'quantity', 'updated_at');
            }])
            ->orderBy('organization_name')
            ->paginate($request->per_page ?? 10);

            // Log the SQL query for debugging
            \Log::info('Organization search query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);

            // Log the results for debugging
            \Log::info('Organizations found:', [
                'count' => $organizations->count(),
                'total' => $organizations->total(),
                'organizations' => $organizations->items()
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
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'sql' => isset($query) ? $query->toSql() : null,
                'bindings' => isset($query) ? $query->getBindings() : null
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to search organizations. ' . $e->getMessage()
            ], 500);
        }
    }

    public function getDonorSubmissions()
    {
        try {
            $submissions = BloodRequest::with(['donors.user', 'user'])
                ->whereHas('donors')
                ->get()
                ->flatMap(function ($request) {
                    return $request->donors->map(function ($donor) use ($request) {
                        return [
                            'id' => $donor->id,
                            'blood_request_id' => $request->id,
                            'status' => $donor->status,
                            'created_at' => $donor->created_at,
                            'donor' => [
                                'id' => $donor->user->id,
                                'name' => $donor->name,
                                'email' => $donor->email,
                                'blood_group' => $donor->blood_group
                            ],
                            'blood_request' => [
                                'id' => $request->id,
                                'hospital_name' => $request->hospital_name ?? 'Not specified',
                                'required_date' => $request->required_date ?? 'Not specified',
                                'requester_name' => $request->first_name . ' ' . $request->last_name
                            ]
                        ];
                    });
                });

            return response()->json([
                'status' => true,
                'data' => $submissions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching donor submissions: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error fetching donor submissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDonorStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,approved,rejected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $donor = BloodRequestDonor::with(['bloodRequest', 'user'])->findOrFail($id);
            $oldStatus = $donor->status;
            
            $donor->status = $request->status;
            $donor->save();

            // Send notification to donor about status update
            if ($oldStatus !== $request->status) {
                try {
                    $donorUser = $donor->user;
                    if ($donorUser) {
                        $notificationData = [
                            'message' => "Your donor submission for blood request #{$donor->blood_request_id} has been {$request->status}",
                            'blood_request_id' => $donor->blood_request_id,
                            'donor_id' => $donor->id,
                            'status' => $request->status
                        ];

                        $notification = $donorUser->notifications()->create([
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'type' => \App\Notifications\DonorStatusUpdated::class,
                            'data' => json_encode($notificationData),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        \Log::info('Donor status update notification sent:', [
                            'donor_id' => $donor->id,
                            'notification_id' => $notification->id
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to send donor status update notification:', [
                        'donor_id' => $donor->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Donor status updated successfully',
                'data' => $donor
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating donor status: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error updating donor status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getNotifications()
    {
        try {
            $admin = Auth::user();
            \Log::info('Fetching notifications for admin:', [
                'admin_id' => $admin->id,
                'admin_email' => $admin->email
            ]);

            // Get all notifications for the admin
            $notifications = $admin->notifications()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'data' => is_string($notification->data) ? json_decode($notification->data, true) : $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at
                    ];
                });

            \Log::info('Notifications retrieved:', [
                'count' => $notifications->count(),
                'notification_ids' => $notifications->pluck('id')->toArray()
            ]);

            return response()->json($notifications);
        } catch (\Exception $e) {
            \Log::error('Error fetching notifications:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error fetching notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markNotificationAsRead($id)
    {
        try {
            $admin = Auth::user();
            $notification = $admin->notifications()->findOrFail($id);
            $notification->markAsRead();

            return response()->json([
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error marking notification as read:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error marking notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getCampaigns()
    {
        try {
            \Log::info('Admin: Fetching campaigns with interest counts');
            
            $campaigns = Campaign::withCount([
                'interests as interested_count' => function($query) {
                    $query->where('status', 'interested');
                },
                'interests as not_interested_count' => function($query) {
                    $query->where('status', 'not_interested');
                }
            ])
            ->with(['admin', 'interests'])  // Include relationships
            ->orderBy('created_at', 'desc')
            ->get();

            \Log::info('Admin: Campaigns fetched successfully', [
                'count' => $campaigns->count(),
                'sample_counts' => $campaigns->take(1)->map(function($campaign) {
                    return [
                        'id' => $campaign->id,
                        'interested' => $campaign->interested_count,
                        'not_interested' => $campaign->not_interested_count
                    ];
                })
            ]);

            return response()->json([
                'status' => true,
                'data' => $campaigns->map(function($campaign) {
                    return [
                        'id' => $campaign->id,
                        'title' => $campaign->title,
                        'description' => $campaign->description,
                        'start_date' => $campaign->start_date,
                        'end_date' => $campaign->end_date,
                        'location' => $campaign->location,
                        'status' => $campaign->status,
                        'image_path' => $campaign->image_path,
                        'admin' => $campaign->admin,
                        'interested_count' => (int) $campaign->interested_count,
                        'not_interested_count' => (int) $campaign->not_interested_count,
                        'created_at' => $campaign->created_at,
                        'updated_at' => $campaign->updated_at
                    ];
                })
            ]);
        } catch (\Exception $e) {
            \Log::error('Admin: Error fetching campaigns', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch campaigns',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createCampaign(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'location' => 'required|string|max:255',
                'status' => 'required|in:active,completed,cancelled',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            // Remove image from validated data as we'll handle it separately
            unset($validated['image']);
            
            // Add admin_id to the validated data
            $validated['admin_id'] = $request->user()->id;

            // Handle image upload if present
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('campaign-images', 'public');
                $validated['image_path'] = $path;
            }

            $campaign = Campaign::create($validated);

            // Send notifications to all non-admin users
            $users = User::where('is_admin', false)->get();
            Notification::send($users, new NewCampaignNotification($campaign));
            
            return response()->json([
                'status' => true,
                'message' => 'Campaign created successfully',
                'data' => $campaign->load('admin')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create campaign: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to create campaign',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateCampaign(Request $request, $id)
    {
        try {
            $campaign = Campaign::findOrFail($id);
            
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after:start_date',
                'location' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|required|in:active,completed,cancelled',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            // Remove image from validated data
            unset($validated['image']);

            // Handle image upload if present
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($campaign->image_path) {
                    Storage::disk('public')->delete($campaign->image_path);
                }
                $path = $request->file('image')->store('campaign-images', 'public');
                $validated['image_path'] = $path;
            }

            $campaign->update($validated);
            
            return response()->json([
                'status' => true,
                'message' => 'Campaign updated successfully',
                'data' => $campaign->load('admin')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update campaign: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update campaign',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteCampaign($id)
    {
        try {
            $campaign = Campaign::findOrFail($id);
            $campaign->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'Campaign deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting campaign: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete campaign'
            ], 500);
        }
    }

    public function updateCampaignInterest(Request $request, $id)
    {
        try {
            \Log::info('Updating campaign interest:', [
                'campaign_id' => $id,
                'user_id' => auth()->id(),
                'status' => $request->status
            ]);

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:interested,not_interested'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $campaign = Campaign::findOrFail($id);
            $user = auth()->user();

            // Update or create the interest status using sync
            $campaign->interests()->syncWithoutDetaching([
                $user->id => ['status' => $request->status]
            ]);

            // Get updated counts
            $interestedCount = $campaign->interests()->wherePivot('status', 'interested')->count();
            $notInterestedCount = $campaign->interests()->wherePivot('status', 'not_interested')->count();

            \Log::info('Campaign interest updated successfully:', [
                'campaign_id' => $id,
                'interested_count' => $interestedCount,
                'not_interested_count' => $notInterestedCount
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Interest status updated successfully',
                'data' => [
                    'interested_count' => $interestedCount,
                    'not_interested_count' => $notInterestedCount
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating campaign interest: ' . $e->getMessage(), [
                'campaign_id' => $id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to update interest status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 