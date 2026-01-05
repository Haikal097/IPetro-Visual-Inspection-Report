<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Api\PhotoReportController;

Route::middleware('auth:sanctum')->group(function () {

    // Reports API
    Route::apiResource('reports', ReportController::class);
    Route::post('/reports/{id}/submit', [ReportController::class, 'submit']);
    Route::post('/reports/{id}/approve', [ReportController::class, 'approve']);

    // Photo Report Routes
    Route::prefix('reports')->group(function () {
        Route::get('/{reportId}/photo-report', [PhotoReportController::class, 'getPhotoReport']);
        Route::put('/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport']);
        Route::post('/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport']);
        Route::delete('/{reportId}/photo-report', [PhotoReportController::class, 'deletePhotoReport']);
    });

    // Optional list
    Route::get('/photo-reports', [PhotoReportController::class, 'index']);
});
