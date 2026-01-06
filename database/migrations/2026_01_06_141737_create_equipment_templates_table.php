<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('equipment_templates', function (Blueprint $table) {
            $table->id();

            // If you want templates per user (user can make their own)
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // What appears in dropdown, e.g. "Nitrogen Vessel"
            $table->string('equipment_type', 120);

            // Optional short description
            $table->string('title', 180)->nullable();

            // The actual default texts to auto-fill
            $table->longText('initial_finding')->nullable();
            $table->longText('external_finding')->nullable();
            $table->longText('internal_finding')->nullable();
            $table->longText('ndt')->nullable();
            $table->longText('recommendations')->nullable();

            // allow "global templates" + "user templates"
            $table->boolean('is_global')->default(false);

            $table->timestamps();

            $table->index(['equipment_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_templates');
    }
};
