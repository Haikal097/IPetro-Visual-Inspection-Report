<?php

// database/migrations/xxxx_xx_xx_add_signing_fields_to_reports.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('reports', function (Blueprint $table) {
      $table->foreignId('inspector_id')->nullable()->constrained('users')->nullOnDelete();
      $table->timestamp('signed_at')->nullable();
    });
  }

  public function down(): void {
    Schema::table('reports', function (Blueprint $table) {
      $table->dropConstrainedForeignId('inspector_id');
      $table->dropColumn(['signed_at']);
    });
  }
};

