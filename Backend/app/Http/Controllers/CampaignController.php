<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\User;
use App\Notifications\NewCampaignNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CampaignController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            $campaigns = Campaign::with(['admin'])
            ->withCount([
                'interests as interested_count' => function($query) {
                    $query->where('status', 'interested');
                },
                'interests as not_interested_count' => function($query) {
                    $query->where('status', 'not_interested');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($campaign) use ($user) {
                // Get the user's interest status for this campaign
                $userInterest = $campaign->interests()
                    ->where('user_id', $user->id)
                    ->first();

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
                    'user_interest' => $userInterest ? $userInterest->pivot->status : null,
                    'interested_count' => (int)$campaign->interested_count,
                    'not_interested_count' => (int)$campaign->not_interested_count,
                    'created_at' => $campaign->created_at,
                    'updated_at' => $campaign->updated_at
                ];
            });

            return response()->json([
                'status' => true,
                'data' => $campaigns
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching campaigns:', [
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

    public function getUserInterests()
    {
        try {
            $user = Auth::user();
            $interests = $user->campaignInterests()
                ->with('campaign')
                ->get()
                ->map(function($interest) {
                    return [
                        'campaign_id' => $interest->campaign_id,
                        'status' => $interest->status
                    ];
                });

            return response()->json([
                'status' => true,
                'data' => $interests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch campaign interests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'location' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $campaign = new Campaign();
        $campaign->title = $request->title;
        $campaign->description = $request->description;
        $campaign->start_date = $request->start_date;
        $campaign->end_date = $request->end_date;
        $campaign->location = $request->location;
        $campaign->admin_id = Auth::id();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('campaign-images', 'public');
            $campaign->image_path = $path;
        }

        $campaign->save();

        // Notify all users about the new campaign
        $users = User::where('id', '!=', Auth::id())->get();
        foreach ($users as $user) {
            $user->notify(new NewCampaignNotification($campaign));
        }

        return response()->json([
            'message' => 'Campaign created successfully',
            'campaign' => $campaign
        ], 201);
    }

    public function updateInterest(Request $request, Campaign $campaign)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:interested,not_interested'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $campaign->interestedUsers()->syncWithoutDetaching([
            $user->id => ['status' => $request->status]
        ]);

        // Get updated counts
        $campaign->loadCount([
            'interests as interested_count' => function($query) {
                $query->where('status', 'interested');
            },
            'interests as not_interested_count' => function($query) {
                $query->where('status', 'not_interested');
            }
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Interest status updated successfully',
            'data' => [
                'interested_count' => $campaign->interested_count,
                'not_interested_count' => $campaign->not_interested_count
            ]
        ]);
    }

    public function destroy(Campaign $campaign)
    {
        if ($campaign->admin_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($campaign->image_path) {
            Storage::disk('public')->delete($campaign->image_path);
        }

        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted successfully']);
    }
} 