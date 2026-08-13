<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ручной (drag-and-drop) порядок заявок, персональный для каждого
     * пользователя. Отсутствие строк для user_id означает «ручной порядок
     * не задан» — используется обычная сортировка (см. OrderController::index).
     */
    public function up(): void
    {
        Schema::create('order_positions', function (Blueprint $table) {
            $table->integer('id', true, true); // AUTO_INCREMENT, уже PRIMARY KEY
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('order_id');
            $table->integer('position');
            $table->timestamps();

            $table->unique(['user_id', 'order_id']);
            $table->index(['user_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_positions');
    }
};
