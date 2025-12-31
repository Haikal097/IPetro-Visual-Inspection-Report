<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 30)->nullable();
            }
            if (!Schema::hasColumn('users', 'company')) {
                $table->string('company', 120)->nullable();
            }
            if (!Schema::hasColumn('users', 'department')) {
                $table->string('department', 120)->nullable();
            }
            if (!Schema::hasColumn('users', 'job_title')) {
                $table->string('job_title', 120)->nullable();
            }

            // inspection credentials
            if (!Schema::hasColumn('users', 'api510_cert_no')) {
                $table->string('api510_cert_no', 80)->nullable();
            }
            if (!Schema::hasColumn('users', 'dosh_reg_no')) {
                $table->string('dosh_reg_no', 80)->nullable();
            }

            // optional: stamp image
            if (!Schema::hasColumn('users', 'stamp_path')) {
                $table->string('stamp_path')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['phone','company','department','job_title','api510_cert_no','dosh_reg_no','stamp_path'] as $col) {
                if (Schema::hasColumn('users', $col)) $table->dropColumn($col);
            }
        });
    }
};
