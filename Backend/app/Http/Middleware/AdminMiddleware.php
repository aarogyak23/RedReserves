<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $user = Auth::guard('admin')->user();
            
            if (!$user) {
                Log::error('Admin middleware: No authenticated user');
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized. Please login.'
                ], 401);
            }

            if (!$user->is_admin) {
                Log::error('Admin middleware: User is not an admin', ['user_id' => $user->id]);
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized access. Admin privileges required.'
                ], 403);
            }

            return $next($request);
        } catch (\Exception $e) {
            Log::error('Admin middleware error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'An error occurred while checking admin privileges.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 