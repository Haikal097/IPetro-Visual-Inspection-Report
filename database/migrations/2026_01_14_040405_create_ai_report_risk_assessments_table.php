<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_report_risk_assessments', function (Blueprint $table) {
            $table->id();

            // link to reports.id (adjust if your PK is different)
            $table->unsignedBigInteger('report_id')->index();

            // rule-based score
            $table->unsignedTinyInteger('score')->default(0); // 0-100
            $table->string('level', 20)->default('Low'); // Low/Medium/High

            // rule reasons (array of strings)
            $table->json('reasons')->nullable();

            // gemini output
            $table->text('ai_explanation')->nullable();      // "Why this is risky"
            $table->string('ai_confidence', 20)->nullable(); // low/medium/high
            $table->string('ai_recommendation', 50)->nullable(); // approve/request_revision/reject

            // metadata
            $table->string('ai_model', 100)->nullable();

            // ✅ Make timeframe NOT NULL so unique() actually prevents duplicates
            $table->string('timeframe', 20)->default('all'); // month/week/all/3months

            $table->timestamp('generated_at')->nullable();

            $table->timestamps();

            // ✅ Avoid duplicates per report per timeframe
            $table->unique(['report_id', 'timeframe']);

            // ✅ Foreign key (update 'reports' + 'id' if your schema differs)
            $table->foreign('report_id')
                ->references('id')
                ->on('reports')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_report_risk_assessments');
    }
};
