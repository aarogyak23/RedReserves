<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

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
            Log::info('Admin middleware: Processing request', [
                'path' => $request->path(),
                'method' => $request->method(),
                'token' => $request->bearerToken() ? 'Present' : 'Missing',
                'headers' => $request->headers->all()
            ]);

            $user = $request->user();
            
            if (!$user) {
                Log::warning('Admin middleware: No authenticated user');
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            if (!$user->is_admin) {
                Log::warning('Admin middleware: Non-admin user attempted access', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized access. Admin privileges required.'
                ], 403);
            }

            Log::info('Admin middleware: Access granted', [
                'user_id' => $user->id,
                'email' => $user->email,
                'path' => $request->path()
            ]);

            return $next($request);
        } catch (\Exception $e) {
            Log::error('Admin middleware error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Authentication error: ' . $e->getMessage()
            ], 500);
        }
    }
} 