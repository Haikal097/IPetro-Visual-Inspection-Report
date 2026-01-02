<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PhotoReportController;
use App\Http\Controllers\ReportController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('reports', ReportController::class);
    Route::post('/reports/{id}/submit', [ReportController::class, 'submit']);
    Route::post('/reports/{id}/approve', [ReportController::class, 'approve']);
});

// Photo Report Routes
Route::prefix('reports')->group(function () {
    // Get photo report for a specific report
    Route::get('/{reportId}/photo-report', [PhotoReportController::class, 'getPhotoReport']);
    
    // Save/update photo report (both PUT and POST)
    Route::put('/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport']);
    Route::post('/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport']);
    
    // Delete photo report
    Route::delete('/{reportId}/photo-report', [PhotoReportController::class, 'deletePhotoReport']);
});

// List all photo reports (optional)
Route::get('/photo-reports', [PhotoReportController::class, 'index']);