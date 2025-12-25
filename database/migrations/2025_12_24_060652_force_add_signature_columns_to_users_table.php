<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'signature_path')) {
                $table->string('signature_path')->nullable()->after('remember_token');
            }

            if (!Schema::hasColumn('users', 'signature_updated_at')) {
                $table->timestamp('signature_updated_at')->nullable()->after('signature_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'signature_path')) {
                $table->dropColumn('signature_path');
            }

            if (Schema::hasColumn('users', 'signature_updated_at')) {
                $table->dropColumn('signature_updated_at');
            }
        });
    }
};
