<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'organization_phone')) {
                $table->string('organization_phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'organization_address')) {
                $table->string('organization_address')->nullable();
            }
            if (!Schema::hasColumn('users', 'organization_name')) {
                $table->string('organization_name')->nullable();
            }
            if (!Schema::hasColumn('users', 'is_organization')) {
                $table->boolean('is_organization')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'organization_phone',
                'organization_address',
                'organization_name',
                'is_organization'
            ]);
        });
    }
}; 