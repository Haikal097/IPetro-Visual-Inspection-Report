<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_report_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('report_id')->nullable(); // if you have reports table FK, you can constrain

            $table->string('provider', 30)->default('gemini');
            $table->string('model', 80)->nullable();
            $table->string('status', 30)->default('generated');

            $table->json('input_payload')->nullable();
            $table->json('output_review')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'report_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_report_reviews');
    }
};
