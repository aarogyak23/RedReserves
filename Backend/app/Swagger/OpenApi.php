<?php

namespace App\Swagger;

/**
 * @OA\OpenApi(
 *     openapi="3.0.0"
 * )
 * @OA\Info(
 *     version="1.0.0",
 *     title="RedReserves API Documentation",
 *     description="API documentation for RedReserves application",
 *     @OA\Contact(
 *         email="admin@redreserves.com"
 *     )
 * )
 * @OA\Server(
 *     description="Local Environment",
 *     url="http://localhost:8000"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer"
 * )
 */
class OpenApi
{
    /**
     * @OA\Post(
     *     path="/api/admin/login",
     *     tags={"Admin"},
     *     summary="Admin login",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="password", type="string", format="password")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string"),
     *             @OA\Property(property="message", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string")
     *         )
     *     )
     * )
     */
    public function adminLogin()
    {
    }
} 