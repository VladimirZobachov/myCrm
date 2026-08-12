<?php

namespace App\Jobs;

use App\Models\ExportJob;
use App\Models\User;
use App\Services\OrderExportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use InvalidArgumentException;
use Throwable;

/**
 * Асинхронная генерация XLS-отчёта (POST /api/orders/export/job).
 * exportJobId — id строки export_jobs, которую нужно обновить по завершении;
 * userId/configType/sdate/edate — параметры, с которыми был поставлен job
 * (configType выбирает метод OrderExportService так же, как OrderExportController).
 */
class GenerateExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public int $exportJobId,
        public int $userId,
        public string $configType,
        public ?string $sdate = null,
        public ?string $edate = null,
    ) {
    }

    public function handle(OrderExportService $service): void
    {
        $exportJob = ExportJob::find($this->exportJobId);
        if (!$exportJob) {
            return;
        }

        $exportJob->update(['status' => ExportJob::STATUS_PROCESSING]);

        $tempPath = match ($this->configType) {
            'admin_detailed' => $service->exportAdminDetailed($this->sdate, $this->edate),
            'admin_summary' => $service->exportAdminSummary($this->sdate, $this->edate),
            'mounter' => $service->exportMounter(User::findOrFail($this->userId), $this->sdate, $this->edate),
            default => throw new InvalidArgumentException("Unknown config_type: {$this->configType}"),
        };

        $exportsDir = storage_path('app/exports');
        if (!is_dir($exportsDir)) {
            mkdir($exportsDir, 0755, true);
        }

        $filename = 'export-' . $exportJob->id . '-' . uniqid() . '.xls';
        $destination = $exportsDir . '/' . $filename;
        // copy+unlink, а не rename(): tempnam() и storage_path() могут лежать
        // на разных примонтированных ФС (кросс-девайс rename() падает).
        copy($tempPath, $destination);
        unlink($tempPath);

        $exportJob->update([
            'status' => ExportJob::STATUS_DONE,
            'file_path' => 'exports/' . $filename,
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        ExportJob::where('id', $this->exportJobId)->update(['status' => ExportJob::STATUS_FAILED]);
    }
}
