<?php

namespace App\Http\Controllers;

use App\Models\BloodRequest;
use App\Models\User;
use App\Models\Donation;
use App\Notifications\BloodRequestApproved;
use App\Notifications\NewDonorNotification;
use App\Notifications\DonorStatusUpdated;
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

            // Create blood request with pending status
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
                'status' => 'pending' // Explicitly set status as pending
            ]);

            \Log::info('Blood request created successfully:', [
                'id' => $bloodRequest->id,
                'status' => $bloodRequest->status
            ]);

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
        try {
            \Log::info('Fetching blood requests for user:', ['user_id' => Auth::id()]);

            // Get all approved blood requests
            $bloodRequests = BloodRequest::with('donors')
                ->where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->get();

            \Log::info('Blood requests fetched:', [
                'count' => $bloodRequests->count(),
                'request_ids' => $bloodRequests->pluck('id')->toArray()
            ]);

            return response()->json($bloodRequests);
        } catch (\Exception $e) {
            \Log::error('Error fetching blood requests:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error fetching blood requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approve(Request $request, BloodRequest $bloodRequest)
    {
        try {
            \Log::info('Starting blood request approval process:', [
                'request_id' => $bloodRequest->id,
                'admin_id' => Auth::id(),
                'current_status' => $bloodRequest->status,
                'request_data' => $request->all()
            ]);

            // Check if the user is an admin
            $user = Auth::user();
            if (!$user || !$user->is_admin) {
                \Log::warning('Non-admin user attempted to approve request:', [
                    'user_id' => $user->id,
                    'is_admin' => $user->is_admin
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Only admins can approve requests.'
                ], 403);
            }

            // Check if request is already approved
            if ($bloodRequest->status === 'approved') {
                \Log::info('Blood request already approved:', [
                    'request_id' => $bloodRequest->id
                ]);
                return response()->json([
                    'message' => 'Blood request is already approved',
                    'blood_request' => $bloodRequest
                ]);
            }

            // Update the blood request status
            $bloodRequest->update([
                'status' => 'approved',
                'admin_remarks' => $request->remarks ?? 'Request approved by admin'
            ]);

            \Log::info('Blood request status updated successfully:', [
                'new_status' => $bloodRequest->status
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

                    $user->notify(new BloodRequestApproved($bloodRequest));
                    
                    // Verify notification was created
                    $notification = $user->notifications()->latest()->first();
                    \Log::info('Notification created for user:', [
                        'user_id' => $user->id,
                        'notification_id' => $notification ? $notification->id : null
                    ]);

                    $notificationCount++;
                } catch (\Exception $e) {
                    \Log::error('Failed to send notification to user:', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
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

    public function addDonor(Request $request, $id)
    {
        try {
            \Log::info('Adding donor to blood request:', [
                'request_id' => $id,
                'donor_data' => $request->all()
            ]);

            // Find the blood request
            $bloodRequest = BloodRequest::with('user')->findOrFail($id);
            
            // Validate donor information
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'email' => 'required|email|max:255',
                'blood_group' => 'required|string|max:5',
                'message' => 'nullable|string'
            ]);

            // Create donor record
            $donor = $bloodRequest->donors()->create([
                'user_id' => Auth::id(),
                'name' => $validatedData['name'],
                'phone' => $validatedData['phone'],
                'email' => $validatedData['email'],
                'blood_group' => $validatedData['blood_group'],
                'message' => $validatedData['message'] ?? null,
                'status' => 'pending'
            ]);

            \Log::info('Donor record created:', [
                'donor_id' => $donor->id,
                'blood_request_id' => $bloodRequest->id
            ]);

            // Send notification to the blood request owner
            try {
                $requester = $bloodRequest->user;
                \Log::info('Sending notification to requester:', [
                    'requester_id' => $requester->id,
                    'requester_email' => $requester->email
                ]);

                $requester->notify(new NewDonorNotification($bloodRequest, $donor));
                
                \Log::info('Notification sent successfully');
            } catch (\Exception $e) {
                \Log::error('Error sending notification:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Donor information submitted successfully',
                'donor' => $donor
            ]);

        } catch (\Exception $e) {
            \Log::error('Error adding donor:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to submit donor information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDonorStatus(Request $request, $requestId, $donorId)
    {
        try {
            \Log::info('Updating donor status:', [
                'request_id' => $requestId,
                'donor_id' => $donorId,
                'data' => $request->all()
            ]);

            $bloodRequest = BloodRequest::with('user')->findOrFail($requestId);
            $donor = $bloodRequest->donors()->with('user')->findOrFail($donorId);

            // Validate status
            $validatedData = $request->validate([
                'status' => 'required|string|in:approved,rejected',
                'remarks' => 'nullable|string|max:1000'
            ]);

            // Update donor status
            $donor->update([
                'status' => $validatedData['status'],
                'admin_remarks' => $validatedData['remarks'] ?? null
            ]);

            \Log::info('Donor status updated:', [
                'donor_id' => $donor->id,
                'new_status' => $validatedData['status']
            ]);

            // Create donation record if donor is approved
            if ($validatedData['status'] === 'approved') {
                \Log::info('Creating donation record for approved donor');
                
                $donation = \App\Models\Donation::create([
                    'donor_id' => $donor->user_id,
                    'request_id' => $requestId,
                    'status' => 'completed',
                    'donation_date' => now(),
                    'notes' => $validatedData['remarks'] ?? null
                ]);

                \Log::info('Donation record created:', [
                    'donation_id' => $donation->id,
                    'donor_id' => $donor->user_id,
                    'request_id' => $requestId
                ]);
            }

            // Send notification to the donor
            $donorUser = $donor->user;
            if ($donorUser) {
                $donorMessage = $validatedData['status'] === 'approved'
                    ? 'Your donation offer has been approved! Thank you for your generosity.'
                    : 'Your donation offer has been declined. Thank you for your interest.';

                \Log::info('Sending notification to donor:', [
                    'donor_id' => $donorUser->id,
                    'donor_email' => $donorUser->email
                ]);

                $donorUser->notify(new DonorStatusUpdated($bloodRequest, $donor, $donorMessage));
            }

            // Send notification to the blood request owner
            $requester = $bloodRequest->user;
            if ($requester) {
                $requesterMessage = $validatedData['status'] === 'approved'
                    ? "You have approved {$donor->name}'s offer to donate blood."
                    : "You have declined {$donor->name}'s offer to donate blood.";

                \Log::info('Sending notification to requester:', [
                    'requester_id' => $requester->id,
                    'requester_email' => $requester->email
                ]);

                $requester->notify(new DonorStatusUpdated($bloodRequest, $donor, $requesterMessage));
            }

            return response()->json([
                'status' => true,
                'message' => 'Donor status updated successfully',
                'data' => $donor
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating donor status:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to update donor status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDonors($id)
    {
        try {
            $bloodRequest = BloodRequest::findOrFail($id);
            $donors = $bloodRequest->donors()->with('user')->get();

            return response()->json([
                'status' => true,
                'data' => $donors
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting donors: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch donors'
            ], 500);
        }
    }
}
