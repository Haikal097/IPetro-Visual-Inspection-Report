<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('report_review_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('report_id');
            $table->unsignedBigInteger('reviewer_id')->nullable();
            $table->enum('action', ['approved', 'rejected', 'revisions_requested', 'submitted', 'resubmitted', 'in_review']);
            $table->text('message')->nullable();
            $table->timestamps();

            $table->index('report_id');
            $table->index('reviewer_id');

            $table->foreign('report_id')->references('id')->on('reports')->onDelete('cascade');
            $table->foreign('reviewer_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_review_logs');
    }
};
