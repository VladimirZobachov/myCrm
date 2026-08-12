<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Асинхронная генерация XLS-отчётов в очереди (GenerateExportJob).
     * params хранит config_type/sdate/edate, с которыми был поставлен job.
     * user_id без FK-constraint — users.id тут integer unsigned (легаси-схема),
     * см. sessions.user_id для того же паттерна.
     */
    public function up(): void
    {
        Schema::create('export_jobs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id');
            $table->enum('status', ['pending', 'processing', 'done', 'failed'])->default('pending');
            $table->string('file_path')->nullable();
            $table->json('params')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_jobs');
    }
};
