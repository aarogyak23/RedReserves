<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\User;
use App\Models\BloodRequest;
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
        $request->validate([
            "email" => "required|email",
            "password" => "required",
        ]);

        $admin = Admin::where("email", $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                "email" => ["The provided credentials are incorrect."],
            ]);
        }

        $token = $admin->createToken("admin-token")->plainTextToken;

        return response()->json([
            "token" => $token,
            "message" => "Login successful",
        ]);
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
            $users = User::select('user_id', 'name', 'last_name', 'email', 'blood_group')
                ->get();

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
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
            $requests = BloodRequest::with('user:user_id,name,last_name')
                ->select('id', 'user_id', 'blood_group', 'status', 'created_at')
                ->get()
                ->map(function ($request) {
                    return [
                        'id' => $request->id,
                        'requester_name' => $request->user->name . ' ' . $request->user->last_name,
                        'blood_group' => $request->blood_group,
                        'status' => $request->status,
                        'created_at' => $request->created_at
                    ];
                });

            return response()->json($requests);
        } catch (\Exception $e) {
            Log::error('Error fetching blood requests: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching blood requests'
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
                'status' => 'required|in:pending,approved,rejected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $bloodRequest = BloodRequest::findOrFail($id);
            $bloodRequest->status = $request->status;
            $bloodRequest->save();

            return response()->json([
                'status' => true,
                'message' => 'Blood request status updated successfully',
                'request' => $bloodRequest
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update blood request status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 