<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_report_drafts', function (Blueprint $table) {

            // ✅ report_id already exists, so DO NOT add it again.

            // Add new columns
            $table->string('provider', 30)->default('gemini')->after('report_id');
            $table->string('model', 80)->nullable()->after('provider');
            $table->string('status', 30)->default('generated')->after('model');

            $table->json('input_payload')->nullable()->after('status');
            $table->json('output_draft')->nullable()->after('input_payload');

            // Optional index
            $table->index(['user_id', 'report_id']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_report_drafts', function (Blueprint $table) {

            // Drop index first (if exists)
            $table->dropIndex(['user_id', 'report_id']);

            // Drop added columns only
            $table->dropColumn([
                'provider',
                'model',
                'status',
                'input_payload',
                'output_draft',
            ]);
        });
    }
};
