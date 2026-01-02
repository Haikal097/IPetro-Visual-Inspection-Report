<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\PhotoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\InspectionCalendarController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SignatureController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AlbumController;
use App\Http\Controllers\Api\PhotoReportController;



Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get( '/photo',[PhotoController::class, 'index'])->name('photo.index');
    Route::post('/upload', [PhotoController::class, 'store'])->name('upload');
    Route::post('/save-edited-image', [PhotoController::class, 'saveEditedImage'])->name('save.edited.image');
    Route::delete('/upload', [PhotoController::class, 'destroy'])->name('upload.destroy');
    Route::get('/photos/temp/{filename}', [PhotoController::class, 'getTempUrl'])->name('photos.temp-url');
       Route::get('/photos/all', [PhotoController::class, 'getAllPhotos'])->name('photos.all');
    Route::put('/photos/{photo}', [PhotoController::class, 'update']); // move/rename
    
    Route::delete('/photos/{photo}', [PhotoController::class, 'destroy']);
    Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');
    Route::get('/report', function () {
        return inertia('Reports/IndexInspector');
    });

    // For creating new report
    Route::get('/pv-report', function () {
        return Inertia::render('Reports/PVReport', [
            'reportId' => null,
        ]);
    })->name('pv-report.create');

    // For editing existing report
    Route::get('/pv-report/{report}', function ($reportId) {
        return Inertia::render('Reports/PVReport', [
            'reportId' => $reportId,
        ]);
    })->name('pv-report.edit');

    Route::get('/inspection-calendar', [InspectionCalendarController::class, 'index'])->name('inspection.calendar');
    Route::get('/inspection-calendar/events', [InspectionCalendarController::class, 'events'])->name('inspection.calendar.events');

    Route::post('/inspection-calendar', [InspectionCalendarController::class, 'store'])->name('inspection.calendar.store');
    Route::put('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'update'])->name('inspection.calendar.update');
    Route::delete('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'destroy'])->name('inspection.calendar.destroy');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');

    Route::get('/calendar', function () {
    return Inertia::render('calendar/InspectionCalendar');
    })->name('calendar');

    // Signature page
    Route::get('/profile/signature', function () {
        return Inertia::render('Profile/Signature');
    })->name('profile.signature');

    // Save signature
    Route::post('/profile/signature', [SignatureController::class, 'store'])
        ->name('profile.signature.store');

    // Example: finalize/sign report route
    Route::post('/reports/{report}/finalize', [ReportController::class, 'finalize'])
        ->name('reports.finalize');

    Route::get('/reports/{report}/download', [ReportController::class, 'download'])
        ->name('reports.download');

    Route::get('/verify/{token}', [ReportController::class, 'verify'])
        ->name('reports.verify');

    // User Management
    Route::prefix('admin')->middleware(['role:admin'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
        Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus'])->name('admin.users.updateStatus');
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('admin.users.resetPassword');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('/users/bulk-actions', [UserController::class, 'bulkActions'])->name('admin.users.bulkActions');
    });

    // Album Management
    Route::get('/albums', [AlbumController::class, 'index']);
    Route::post('/albums', [AlbumController::class, 'store']);
    Route::put('/albums/{album}', [AlbumController::class, 'update']);
    Route::delete('/albums/{album}', [AlbumController::class, 'destroy']);
    
    Route::get('/reports/{reportId}/photo-report', [PhotoReportController::class, 'getPhotoReport'])
        ->name('reports.photo-report.get');

    Route::post('/reports/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport'])
        ->name('reports.photo-report.save');

    Route::put('/reports/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport'])
        ->name('reports.photo-report.update');

    Route::delete('/reports/{reportId}/photo-report', [PhotoReportController::class, 'deletePhotoReport'])
        ->name('reports.photo-report.delete');

   Route::get('/reports/photo-report', function () {
        return inertia('Reports/PhotoReport', [
            'reportId' => request()->query('report_id'),
        ]);
    });

});

Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports/{report}', [ReportController::class, 'show']);
    Route::put('/reports/{report}', [ReportController::class, 'update']);
    Route::delete('/reports/{report}', [ReportController::class, 'destroy']);

    Route::post('/reports/{id}/submit', [ReportController::class, 'submit']);
    Route::post('/reports/{id}/approve', [ReportController::class, 'approve']);
});

require __DIR__.'/settings.php';
