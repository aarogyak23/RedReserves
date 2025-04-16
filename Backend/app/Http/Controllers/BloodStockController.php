<?php

namespace App\Http\Controllers;

use App\Models\BloodStock;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BloodStockController extends Controller
{
    public function getOrganizationStocks($organizationId)
    {
        try {
            $stocks = BloodStock::where('organization_id', $organizationId)->get();
            return response()->json($stocks);
        } catch (\Exception $e) {
            Log::error('Error fetching blood stocks: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch blood stocks'], 500);
        }
    }

    public function updateStock(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->is_organization) {
                return response()->json(['error' => 'Unauthorized. Only organizations can update blood stocks.'], 403);
            }

            $validated = $request->validate([
                'blood_group' => 'required|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'quantity' => 'required|integer|min:0'
            ]);

            $stock = BloodStock::updateOrCreate(
                [
                    'organization_id' => $user->id,
                    'blood_group' => $validated['blood_group']
                ],
                ['quantity' => $validated['quantity']]
            );

            return response()->json($stock);
        } catch (\Exception $e) {
            Log::error('Error updating blood stock: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update blood stock'], 500);
        }
    }

    public function getAllOrganizationsWithStocks()
    {
        try {
            $organizations = User::where('is_organization', true)
                ->with('bloodStocks')
                ->get();
            
            return response()->json($organizations);
        } catch (\Exception $e) {
            Log::error('Error fetching organizations with stocks: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch organizations'], 500);
        }
    }
} 