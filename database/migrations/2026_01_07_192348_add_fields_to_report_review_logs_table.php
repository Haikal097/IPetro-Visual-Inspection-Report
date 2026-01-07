<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_review_logs', function (Blueprint $table) {

            // ✅ Add columns first (only if they don't exist yet)
            if (!Schema::hasColumn('report_review_logs', 'report_id')) {
                $table->unsignedBigInteger('report_id')->after('id');
            }

            if (!Schema::hasColumn('report_review_logs', 'reviewer_id')) {
                $table->unsignedBigInteger('reviewer_id')->nullable()->after('report_id');
            }

            if (!Schema::hasColumn('report_review_logs', 'action')) {
                $table->string('action')->after('reviewer_id');
            }

            if (!Schema::hasColumn('report_review_logs', 'message')) {
                $table->text('message')->nullable()->after('action');
            }

            // ✅ FK to reports.report_id (NOT reports.id)
            $table->foreign('report_id', 'report_review_logs_report_id_fk')
                ->references('report_id')
                ->on('reports')
                ->onDelete('cascade');

            // ✅ FK to users.id
            $table->foreign('reviewer_id', 'report_review_logs_reviewer_id_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('report_review_logs', function (Blueprint $table) {

            // Drop FK first
            if (Schema::hasColumn('report_review_logs', 'report_id')) {
                $table->dropForeign('report_review_logs_report_id_fk');
            }

            if (Schema::hasColumn('report_review_logs', 'reviewer_id')) {
                $table->dropForeign('report_review_logs_reviewer_id_fk');
            }

            // Drop columns
            $cols = [];
            foreach (['report_id', 'reviewer_id', 'action', 'message'] as $c) {
                if (Schema::hasColumn('report_review_logs', $c)) $cols[] = $c;
            }

            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
