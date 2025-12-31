<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Allow 'inspector' first
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','inspector','reviewer','admin') DEFAULT 'inspector'");

        // 2) Convert old 'user' rows to 'inspector'
        DB::table('users')
            ->where('role', 'user')
            ->update(['role' => 'inspector']);

        // 3) (Optional) remove 'user' from enum afterwards (ONLY if you are sure no rows still use 'user')
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('inspector','reviewer','admin') DEFAULT 'inspector'");
    }

    public function down(): void
    {
        // 1) Allow 'user' first (so update won't fail)
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','inspector','reviewer','admin') DEFAULT 'user'");

        // 2) Convert back inspector -> user
        DB::table('users')
            ->where('role', 'inspector')
            ->update(['role' => 'user']);

        // 3) Remove 'inspector' from enum (optional)
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','reviewer','admin') DEFAULT 'user'");
    }
};
