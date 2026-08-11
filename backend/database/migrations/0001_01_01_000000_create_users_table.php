<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Реальная схема из прод-дампа firmaacru_crm.sql (11.08.2026).
     * Важно: price/price_admin — VARCHAR, т.к. в legacy хранятся нечисловые
     * значения («По факту», «-», «-456», «5500+»).
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->integer('id', false, true);
            $table->string('email', 300);
            $table->string('login', 100);
            $table->string('passwd', 100);
            $table->tinyInteger('type_user');
            $table->string('fio', 500)->default('');

            $table->primary('id');
            $table->index('login');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
