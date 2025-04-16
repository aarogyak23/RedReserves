<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('blood_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('users')->onDelete('cascade');
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
            $table->integer('quantity')->default(0);
            $table->timestamps();
            
            // Ensure unique combination of organization and blood group
            $table->unique(['organization_id', 'blood_group']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('blood_stocks');
    }
}; 