<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
      public function up(): void {
    Schema::create('inspections', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // inspector
      $table->string('title'); // e.g., "PV Inspection - V-101"
      $table->string('tag')->nullable(); // equipment tag
      $table->string('location')->nullable();
      $table->text('notes')->nullable();

      $table->dateTime('start_at');
      $table->dateTime('end_at')->nullable();

      $table->enum('status', ['planned','in_progress','completed','cancelled'])->default('planned');

      // reminders
      $table->boolean('remind_1d')->default(true);
      $table->boolean('remind_1h')->default(true);
      $table->dateTime('reminded_1d_at')->nullable();
      $table->dateTime('reminded_1h_at')->nullable();

      $table->timestamps();
    });
  }

  public function down(): void {
    Schema::dropIfExists('inspections');
  }
};
