<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {

            if (!Schema::hasColumn('reports', 'signed_ip')) {
                $table->string('signed_ip')->nullable();
            }

            if (!Schema::hasColumn('reports', 'signed_user_agent')) {
                $table->string('signed_user_agent', 512)->nullable();
            }

            if (!Schema::hasColumn('reports', 'signature_sha256')) {
                $table->string('signature_sha256', 64)->nullable();
            }

            if (!Schema::hasColumn('reports', 'pdf_snapshot_path')) {
                $table->string('pdf_snapshot_path')->nullable();
            }

            if (!Schema::hasColumn('reports', 'pdf_sha256')) {
                $table->string('pdf_sha256', 64)->nullable();
            }

            if (!Schema::hasColumn('reports', 'verification_token')) {
                $table->string('verification_token', 64)->nullable();
            }
        });
    }


    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn([
                'signed_ip',
                'signed_user_agent',
                'signature_sha256',
                'pdf_snapshot_path',
                'pdf_sha256',
                'verification_token',
            ]);
        });
    }
};
