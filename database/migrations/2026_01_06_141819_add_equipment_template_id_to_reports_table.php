<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('equipment_template_id')
                ->nullable()
                ->constrained('equipment_templates')
                ->nullOnDelete()
                ->after('report_id'); // ✅ correct column
        });
    }


    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropForeign(['equipment_template_id']);
            $table->dropColumn('equipment_template_id');
        });
    }
};

