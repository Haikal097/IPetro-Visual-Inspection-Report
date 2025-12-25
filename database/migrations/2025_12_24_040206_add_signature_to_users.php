<?php

// database/migrations/xxxx_xx_xx_add_signature_to_users.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('users', function (Blueprint $table) {
      $table->string('signature_path')->nullable()->after('email');
      $table->timestamp('signature_updated_at')->nullable()->after('signature_path');
    });
  }

  public function down(): void {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn(['signature_path', 'signature_updated_at']);
    });
  }
};

