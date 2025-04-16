<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Donation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DonationController extends Controller
{
    public function getUserDonationHistory()
    {
        try {
            $user = Auth::user();
            Log::info('Fetching donation history for user:', ['user_id' => $user->id]);

            $donations = Donation::where('donor_id', $user->id)
                ->with(['request' => function($query) {
                    $query->select('id', 'blood_group', 'first_name', 'last_name', 'user_id');
                }])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($donation) {
                    return [
                        'id' => $donation->id,
                        'donation_date' => $donation->donation_date,
                        'recipient_name' => $donation->request ? 
                            $donation->request->first_name . ' ' . $donation->request->last_name : 
                            'Unknown Recipient',
                        'blood_group' => $donation->request ? 
                            $donation->request->blood_group : 
                            'Unknown',
                        'hospital_name' => 'Red Reserve Blood Bank', // Default hospital name
                        'status' => $donation->status,
                    ];
                });

            Log::info('Successfully fetched donation history', [
                'count' => $donations->count(),
                'donation_ids' => $donations->pluck('id')->toArray()
            ]);

            return response()->json($donations);
        } catch (\Exception $e) {
            Log::error('Error fetching user donation history: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to fetch donation history'], 500);
        }
    }
} 