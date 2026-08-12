<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateExportJob;
use App\Models\ExportJob;
use App\Services\OrderExportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * GET /api/orders/export — перенос legacy index.php::export().
 *
 * Аудит A2: в legacy sdate/edate конкатенировались в SQL-запрос без
 * экранирования (SQL-инъекция через параметры дат). Здесь sdate/edate
 * строго валидируются форматом Y-m-d до попадания в OrderExportService —
 * никакой raw-конкатенации значений в запрос нет (Order::query() ->
 * where() использует параметризованные биндинги).
 */
class OrderExportController extends Controller
{
    public function __invoke(Request $request, OrderExportService $service): StreamedResponse
    {
        $data = $this->validateDates($request);

        $user = $request->user();
        $sdate = $data['sdate'] ?? null;
        $edate = $data['edate'] ?? null;

        if ($user->isAdmin()) {
            $path = $request->boolean('sum')
                ? $service->exportAdminSummary($sdate, $edate)
                : $service->exportAdminDetailed($sdate, $edate);
        } elseif ($user->isInstaller()) {
            // Экспорт монтажника — всегда его собственная детализация с автосуммой,
            // sum= для этой роли не имеет отдельного legacy-режима.
            $path = $service->exportMounter($user, $sdate, $edate);
        } else {
            abort(403, 'Экспорт недоступен для этой роли');
        }

        $filename = 'mycrm-export-' . now()->format('Y-m-d') . '.xls';

        return response()->streamDownload(function () use ($path) {
            readfile($path);
            unlink($path);
        }, $filename, ['Content-Type' => 'application/vnd.ms-excel']);
    }

    /**
     * POST /api/orders/export/job — ставит генерацию XLS в очередь
     * (GenerateExportJob) вместо синхронной генерации в __invoke().
     * Роли/валидация дат — как в обычном экспорте.
     */
    public function storeJob(Request $request): JsonResponse
    {
        $data = $this->validateDates($request);
        $user = $request->user();
        $sdate = $data['sdate'] ?? null;
        $edate = $data['edate'] ?? null;

        if ($user->isAdmin()) {
            $configType = $request->boolean('sum') ? 'admin_summary' : 'admin_detailed';
        } elseif ($user->isInstaller()) {
            $configType = 'mounter';
        } else {
            abort(403, 'Экспорт недоступен для этой роли');
        }

        $exportJob = ExportJob::create([
            'user_id' => $user->id,
            'status' => ExportJob::STATUS_PENDING,
            'params' => [
                'config_type' => $configType,
                'sdate' => $sdate,
                'edate' => $edate,
            ],
        ]);

        GenerateExportJob::dispatch($exportJob->id, $user->id, $configType, $sdate, $edate);

        return response()->json([
            'id' => $exportJob->id,
            'status' => $exportJob->status,
        ], 201);
    }

    /**
     * GET /api/orders/export/job/{id} — статус фоновой генерации.
     */
    public function showJob(Request $request, int $id): JsonResponse
    {
        $exportJob = $this->findOwnedJob($request, $id);

        return response()->json([
            'id' => $exportJob->id,
            'status' => $exportJob->status,
        ]);
    }

    /**
     * GET /api/orders/export/job/{id}/download — скачивание готового файла.
     */
    public function downloadJob(Request $request, int $id): StreamedResponse
    {
        $exportJob = $this->findOwnedJob($request, $id);

        if ($exportJob->status !== ExportJob::STATUS_DONE || !$exportJob->file_path) {
            abort(409, 'Отчёт ещё не готов');
        }

        $fullPath = storage_path('app/' . $exportJob->file_path);
        if (!is_file($fullPath)) {
            abort(404, 'Файл отчёта не найден');
        }

        $filename = 'mycrm-export-' . $exportJob->id . '.xls';

        return response()->streamDownload(function () use ($fullPath) {
            readfile($fullPath);
        }, $filename, ['Content-Type' => 'application/vnd.ms-excel']);
    }

    protected function findOwnedJob(Request $request, int $id): ExportJob
    {
        $exportJob = ExportJob::findOrFail($id);
        $user = $request->user();

        if ($exportJob->user_id !== $user->id && !$user->isAdmin()) {
            abort(403, 'Доступ к этому отчёту запрещён');
        }

        return $exportJob;
    }

    /**
     * Валидация дат. Принимает ОБА варианта имён (legacy export.php использует
     * from/to, новый API — sdate/edate). Невалидные даты → 422 (аудит A2:
     * закрывает SQL-инъекцию через параметры дат).
     *
     * @return array{sdate?: ?string, edate?: ?string}
     */
    protected function validateDates(Request $request): array
    {
        $validated = $request->validate([
            'sdate' => 'nullable|date_format:Y-m-d',
            'edate' => 'nullable|date_format:Y-m-d',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d',
        ]);

        return [
            'sdate' => $validated['sdate'] ?? $validated['from'] ?? null,
            'edate' => $validated['edate'] ?? $validated['to'] ?? null,
        ];
    }
}
