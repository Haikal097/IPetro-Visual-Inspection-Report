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
        Schema::create('photo_reports', function (Blueprint $table) {
            $table->id();
            
            // Reference the CORRECT column in reports table
            // Use unsignedBigInteger instead of foreignId for custom column name
            $table->unsignedBigInteger('report_id')->nullable();
            
            $table->string('report_title')
                  ->nullable()
                  ->default('VISUAL INTERNAL INSPECTION');
                  
            $table->string('report_number')
                  ->nullable()
                  ->unique();
                  
            $table->date('inspection_date')
                  ->nullable();
                  
            $table->string('pmt')
                  ->nullable();
                  
            $table->string('tag')
                  ->nullable();
                  
            $table->text('description')
                  ->nullable();
                  
            $table->string('plant_unit')
                  ->nullable();
            
            $table->json('report_data')
                  ->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Add the foreign key constraint manually
            $table->foreign('report_id')
                  ->references('report_id')
                  ->on('reports')
                  ->onDelete('cascade');
            
            $table->index('report_id');
            $table->index('report_number');
            $table->index('inspection_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('photo_reports');
    }
};