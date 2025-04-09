<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('campaigns')) {
            Schema::create('campaigns', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description');
                $table->dateTime('start_date');
                $table->dateTime('end_date');
                $table->string('location');
                $table->string('image_path')->nullable();
                $table->foreignId('admin_id')->constrained('users');
                $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('campaign_user')) {
            Schema::create('campaign_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('status', ['interested', 'not_interested'])->default('interested');
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('campaign_user');
        Schema::dropIfExists('campaigns');
    }
}; 