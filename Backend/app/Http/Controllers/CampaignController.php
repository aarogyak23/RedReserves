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
        $campaigns = Campaign::with('admin')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($campaigns);
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

        return response()->json([
            'message' => 'Interest status updated successfully'
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