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
        Schema::create('orders', function (Blueprint $table) {
            $table->increments('id');
            $table->dateTime('date_create')->useCurrent();
            $table->date('date');
            $table->string('trc', 255)->nullable();
            $table->string('trc_other', 255)->nullable();
            $table->text('type_work')->nullable();
            $table->string('brand', 255)->nullable();
            $table->string('where_print', 255)->nullable();
            $table->string('where_other', 255)->nullable();
            $table->text('photo')->nullable()->comment('текстовые ссылки через пробел (legacy)');
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('price_admin', 12, 2)->nullable()->comment('цена для админа (price*0.7)');
            $table->string('importance', 255)->nullable();
            $table->string('importance_other', 255)->nullable();
            $table->unsignedInteger('created_by')->comment('кто создал (менеджер)');
            $table->unsignedInteger('created_for')->nullable()->comment('кому назначено (монтажник)');
            $table->text('comment_admin')->nullable();
            $table->text('comment_mounter')->nullable();
            $table->tinyInteger('status')->default(1)->comment('1=В ожидании, 2=Принят, 3=Выполнено');
            $table->tinyInteger('is_archived')->default(0);

            $table->index('created_by', 'idx_orders_created_by');
            $table->index('created_for', 'idx_orders_created_for');
            $table->index('status', 'idx_orders_status');
            $table->index('is_archived', 'idx_orders_is_archived');
            $table->index('date', 'idx_orders_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
