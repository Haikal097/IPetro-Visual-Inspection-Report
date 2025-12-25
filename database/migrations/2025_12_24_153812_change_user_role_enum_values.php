<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update existing 'user' roles to 'inspector'
        DB::table('users')
            ->where('role', 'user')
            ->update(['role' => 'inspector']);

        // Then modify the column enum values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('inspector', 'reviewer', 'admin') DEFAULT 'inspector'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, update existing 'inspector' roles back to 'user'
        DB::table('users')
            ->where('role', 'inspector')
            ->update(['role' => 'user']);

        // Then modify the column enum values back
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'reviewer', 'admin') DEFAULT 'user'");
    }
};