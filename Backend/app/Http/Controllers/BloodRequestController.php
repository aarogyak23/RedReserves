<?php

namespace App\Http\Controllers;

use App\Models\BloodRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BloodRequestController extends Controller
{
    public function store(Request $request)
    {
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
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Handle file upload
            $file = $request->file('requisition_form');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('requisition_forms', $fileName, 'public');

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
                'requisition_form_path' => $filePath
            ]);

            return response()->json([
                'message' => 'Blood request submitted successfully',
                'blood_request' => $bloodRequest
            ], 201);

        } catch (\Exception $e) {
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
}
