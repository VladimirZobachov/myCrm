<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderExportController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\MigrationMetricsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'mycrm-api',
        'time' => now()->toIso8601String(),
    ]);
});

// Auth (публичные)
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Named route 'login' — сюда Laravel редиректит неавторизованных (route('login')).
// Возвращаем 401 JSON, а не HTML/404 (фикс бага #12: было 500 "Route [login] not defined").
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Auth (требуют JWT)
Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Экспорт заявок в XLS — ДОЛЖЕН стоять перед apiResource('orders'),
    // иначе orders/{order} перехватит /orders/export как id.
    Route::get('/orders/export', OrderExportController::class);

    // Асинхронная генерация XLS-отчёта в очереди (GenerateExportJob) — тоже
    // перед apiResource('orders'), по той же причине.
    Route::post('/orders/export/job', [OrderExportController::class, 'storeJob']);
    Route::get('/orders/export/job/{id}', [OrderExportController::class, 'showJob']);
    Route::get('/orders/export/job/{id}/download', [OrderExportController::class, 'downloadJob']);

    // Фото заявок — DELETE стоит ПЕРЕД apiResource('orders'), чтобы
    // /orders/photos/{photo} не путался с destroy() из apiResource (/orders/{order}).
    Route::delete('/orders/photos/{photo}', [PhotoController::class, 'destroy']);

    Route::apiResource('orders', OrderController::class);
    Route::post('/orders/{order}/photos', [PhotoController::class, 'store']);
    Route::patch('/orders/{order}/comment', [OrderController::class, 'updateComment']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/archive', [OrderController::class, 'archive']);

    // Пользователи (только админ)
    Route::apiResource('users', UserController::class);

    // Метрики миграции на v2 (только админ, задача #64)
    Route::get('/migration/metrics', MigrationMetricsController::class);

    // Личный кабинет
    Route::get('/me', [MeController::class, 'show']);
    Route::patch('/me', [MeController::class, 'update']);
});
