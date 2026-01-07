<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_chat_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('title', 120)->nullable(); // e.g. "Inspector Chat - PV-Report"
            $table->string('provider', 30)->default('gemini');
            $table->string('model', 80)->nullable();
            $table->string('status', 30)->default('active');

            $table->json('context')->nullable(); // optional context (equipmentTag, reportId, etc)
            $table->timestamp('last_message_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_chat_sessions');
    }
};
