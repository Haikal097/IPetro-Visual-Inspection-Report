<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('photos', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->foreignId('album_id')->nullable()->constrained('albums')->nullOnDelete();

      $table->string('name');
      $table->string('path');
      $table->unsignedBigInteger('size')->default(0);

      $table->timestamps();

      $table->index(['user_id', 'album_id']);
    });
  }

  public function down(): void {
    Schema::dropIfExists('photos');
  }
};

