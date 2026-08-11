<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('login', 100);
            $table->string('email', 255);
            $table->string('fio', 255)->nullable();
            $table->string('passwd', 255);
            $table->tinyInteger('type_user')->default(3)->comment('1=админ, 2=менеджер, 3=монтажник');

            $table->unique('login', 'uq_users_login');
            $table->unique('email', 'uq_users_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
