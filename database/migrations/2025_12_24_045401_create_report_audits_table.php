<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Safety: remove broken table from previous failed attempts
        Schema::dropIfExists('report_audits');

        Schema::create('report_audits', function (Blueprint $table) {

            // Primary key for audit table
            $table->bigIncrements('id');

            /**
             * MUST match reports.report_id
             * reports.report_id = BIGINT UNSIGNED
             */
            $table->unsignedBigInteger('report_id');

            /**
             * users.id = BIGINT UNSIGNED (Laravel default)
             */
            $table->unsignedBigInteger('user_id')->nullable();

            $table->string('action');              // CREATED, UPDATED, FINALIZED, etc.
            $table->json('meta')->nullable();      // extra audit info
            $table->timestamps();

            // Indexes
            $table->index('report_id');
            $table->index('user_id');
            $table->index('action');

            // Foreign keys (IMPORTANT PART)
            $table->foreign('report_id')
                ->references('report_id')
                ->on('reports')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_audits');
    }
};
