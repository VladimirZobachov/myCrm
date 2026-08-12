<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderExportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\MeController;

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

    Route::apiResource('orders', OrderController::class);
    Route::patch('/orders/{order}/comment', [OrderController::class, 'updateComment']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/archive', [OrderController::class, 'archive']);

    // Пользователи (только админ)
    Route::apiResource('users', UserController::class);

    // Личный кабинет
    Route::get('/me', [MeController::class, 'show']);
    Route::patch('/me', [MeController::class, 'update']);
});
