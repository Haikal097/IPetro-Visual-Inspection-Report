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
        Schema::create('reports', function (Blueprint $table) {
            $table->id('report_id'); // Primary key
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade'); // Foreign key to users table
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->onDelete('set null'); // Foreign key to users table, can be null
            $table->enum('status', [
                'draft', 
                'submitted', 
                'in_review', 
                'approved', 
                'rejected', 
                'archived'
            ])->default('draft'); // Report status
            $table->dateTime('creation_date')->useCurrent(); // When report was created
            $table->dateTime('submission_date')->nullable(); // When report was submitted for review
            $table->json('json_data')->nullable(); // Store the JSON data (consider using json type)
            $table->timestamps(); // Created_at and updated_at columns
            
            // Indexes for better query performance
            $table->index('creator_id');
            $table->index('reviewer_id');
            $table->index('status');
            $table->index('creation_date');
            $table->index('submission_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
