<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Реальная схема sessions из прод-дампа firmaacru_crm.sql (11.08.2026).
     * time — int(20) unixtimestamp.
     */
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->integer('id', false, true);
            $table->string('sessid', 100);
            $table->integer('user_id');
            $table->bigInteger('time');

            $table->primary('id');
            $table->index('sessid');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
