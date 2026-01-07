<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            ALTER TABLE reports
            MODIFY status ENUM(
                'draft',
                'submitted',
                'in_review',
                'revisions_requested',
                'approved',
                'rejected'
            ) NOT NULL DEFAULT 'draft'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE reports
            MODIFY status ENUM(
                'draft',
                'submitted',
                'in_review',
                'approved',
                'rejected'
            ) NOT NULL DEFAULT 'draft'
        ");
    }
};
