<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_chat_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('session_id')
                ->constrained('ai_chat_sessions')
                ->cascadeOnDelete();

            $table->enum('role', ['user', 'assistant']);
            $table->longText('content');

            // optional debugging / analytics
            $table->unsignedInteger('prompt_tokens')->nullable();
            $table->unsignedInteger('completion_tokens')->nullable();

            $table->timestamps();

            $table->index(['session_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_chat_messages');
    }
};
