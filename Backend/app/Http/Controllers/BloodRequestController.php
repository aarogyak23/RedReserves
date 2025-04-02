<?php

namespace App\Http\Controllers;

use App\Models\BloodRequest;
use App\Models\User;
use App\Notifications\BloodRequestApproved;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BloodRequestController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Log the incoming request data
            \Log::info('Blood request submission - Request data:', $request->except('requisition_form'));
            \Log::info('Blood request submission - File present:', ['has_file' => $request->hasFile('requisition_form')]);

            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:20',
                'address' => 'required|string',
                'date_of_birth' => 'required|date',
                'gender' => 'required|string|in:male,female,other',
                'blood_group' => 'required|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'requisition_form' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048'
            ]);

            if ($validator->fails()) {
                \Log::warning('Blood request validation failed:', $validator->errors()->toArray());
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Handle file upload
            $file = $request->file('requisition_form');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('requisition_forms', $fileName, 'public');

            \Log::info('Blood request file uploaded:', [
                'original_name' => $file->getClientOriginalName(),
                'stored_path' => $filePath
            ]);

            // Create blood request
            $bloodRequest = BloodRequest::create([
                'user_id' => Auth::id(),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'blood_group' => $request->blood_group,
                'requisition_form_path' => $filePath,
                'status' => 'pending'
            ]);

            \Log::info('Blood request created successfully:', ['id' => $bloodRequest->id]);

            return response()->json([
                'message' => 'Blood request submitted successfully',
                'blood_request' => $bloodRequest
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error submitting blood request:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error submitting blood request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $bloodRequests = BloodRequest::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bloodRequests);
    }

    public function approve(Request $request, BloodRequest $bloodRequest)
    {
        try {
            \Log::info('Starting blood request approval process:', [
                'request_id' => $bloodRequest->id,
                'admin_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            // Update the blood request status
            $bloodRequest->update([
                'status' => 'approved',
                'admin_remarks' => $request->remarks ?? 'Request approved by admin'
            ]);

            \Log::info('Blood request status updated successfully');

            // Get all users except the one who made the request
            $users = User::where('id', '!=', $bloodRequest->user_id)->get();
            \Log::info('Found users to notify:', [
                'count' => $users->count(),
                'user_ids' => $users->pluck('id')->toArray(),
                'user_emails' => $users->pluck('email')->toArray()
            ]);

            // Send notification to all users
            $notificationCount = 0;
            foreach ($users as $user) {
                try {
                    \Log::info('Attempting to send notification to user:', [
                        'user_id' => $user->id,
                        'user_email' => $user->email
                    ]);

                    $user->notify(new BloodRequestApproved($bloodRequest));
                    
                    // Verify notification was created
                    $notification = $user->notifications()->latest()->first();
                    \Log::info('Notification created for user:', [
                        'user_id' => $user->id,
                        'notification_id' => $notification ? $notification->id : null,
                        'notification_data' => $notification ? $notification->data : null
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

            \Log::info('Blood request approval process completed:', [
                'request_id' => $bloodRequest->id,
                'notifications_sent' => $notificationCount
            ]);

            return response()->json([
                'message' => 'Blood request approved successfully',
                'blood_request' => $bloodRequest,
                'notifications_sent' => $notificationCount
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in blood request approval:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error approving blood request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getNotifications()
    {
        try {
            $user = Auth::user();
            \Log::info('Fetching notifications for user:', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'auth_check' => Auth::check()
            ]);

            // Get all notifications for the user
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'data' => json_decode($notification->data, true),
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at
                    ];
                });

            \Log::info('Notifications retrieved:', [
                'count' => $notifications->count(),
                'notification_ids' => $notifications->pluck('id')->toArray(),
                'notification_data' => $notifications->toArray()
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
            $user = Auth::user();
            $notification = $user->notifications()->findOrFail($id);
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
}
