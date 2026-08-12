<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Реальная схема orders из прод-дампа firmaacru_crm.sql (11.08.2026).
     * price/price_admin — VARCHAR(100): legacy хранит «По факту», «-», «-456».
     * Поля комментариев: comments (общий) + comment_manager (не admin/mounter!).
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->integer('id', true, true); // AUTO_INCREMENT (legacy-схема: id без default → 500 при INSERT)
            $table->dateTime('date_create')->useCurrent();
            $table->date('date')->nullable();
            $table->string('trc', 200);
            $table->string('trc_other', 300)->nullable();
            $table->string('type_work', 500);
            $table->string('brand', 500);
            $table->string('where_print', 500);
            $table->string('where_other', 500)->nullable();
            $table->string('photo', 200);
            $table->string('price', 100);
            $table->string('price_admin', 100)->default('0');
            $table->string('importance', 500);
            $table->string('importance_other', 500);
            $table->integer('created_by')->nullable();
            $table->integer('created_for')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->string('comments', 500)->nullable();
            $table->tinyInteger('is_archived')->default(0);
            $table->string('comment_manager', 500)->default('');

            // id — AUTO_INCREMENT, уже PRIMARY KEY (не нужен отдельный $table->primary('id'))
            $table->index('trc');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
