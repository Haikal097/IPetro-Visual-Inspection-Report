<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->foreignId('assigned_to')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->after('assigned_to')->constrained('users')->nullOnDelete();

            $table->dateTime('overdue_notified_at')->nullable()->after('reminded_1h_at');
        });
    }

    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_to');
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn('overdue_notified_at');
        });
    }
};
