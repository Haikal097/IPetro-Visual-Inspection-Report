<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\PhotoController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\InspectionCalendarController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SignatureController;
use App\Http\Controllers\ProfileController;


Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    /**
     * Photos
     */
    Route::get('/photo', [PhotoController::class, 'index'])->name('photo.index');
    Route::post('/upload', [PhotoController::class, 'store'])->name('upload');
    Route::post('/save-edited-image', [PhotoController::class, 'saveEditedImage'])->name('save.edited.image');
    Route::delete('/upload', [PhotoController::class, 'destroy'])->name('upload.destroy');
    Route::get('/photos/temp/{filename}', [PhotoController::class, 'getTempUrl'])->name('photos.temp-url');
    Route::get('/photos/all', [PhotoController::class, 'getAllPhotos'])->name('photos.all');
    Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');

    Route::get('/report', function () {
        return inertia('Reports/IndexInspector');
    });
    Route::get('/pv-report', function () {
        return Inertia::render('Reports/PVReport');
    });

    Route::get('/inspection-calendar', [InspectionCalendarController::class, 'index'])->name('inspection.calendar');
    Route::get('/inspection-calendar/events', [InspectionCalendarController::class, 'events'])->name('inspection.calendar.events');
    Route::post('/inspection-calendar', [InspectionCalendarController::class, 'store'])->name('inspection.calendar.store');
    Route::put('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'update'])->name('inspection.calendar.update');
    Route::delete('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'destroy'])->name('inspection.calendar.destroy');

    // Old calendar route (if you still need it)
    Route::get('/calendar', function () {
        return Inertia::render('calendar/InspectionCalendar');
    })->name('calendar');

    /**
     * Notifications
     */
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');

    /**
     * Profile (NEW)
     */
    Route::middleware(['auth','verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/stamp', [ProfileController::class, 'uploadStamp'])->name('profile.stamp');
});

    /**
     * Signature page + save signature
     */
    Route::get('/profile/signature', function () {
        return Inertia::render('Profile/Signature');
    })->name('profile.signature');

    Route::post('/profile/signature', [SignatureController::class, 'store'])
        ->name('profile.signature.store');

    /**
     * Report finalize, download, verify
     */
    Route::post('/reports/{report}/finalize', [ReportController::class, 'finalize'])
        ->name('reports.finalize');

    Route::get('/reports/{report}/download', [ReportController::class, 'download'])
        ->name('reports.download');

    Route::get('/verify/{token}', [ReportController::class, 'verify'])
        ->name('reports.verify');




    Route::get('/review', function () {
        return inertia('Reports/IndexReviewer');
    })->name('reports.reviewer');
    
    Route::get('/reviewer/report', function () {
        return Inertia::render('Reviewer/Report');
    })->name('reviewer.report');
});

Route::get('/reports/photo-report', function () {
    return inertia('Reports/PhotoReport');
})->middleware(['auth']);




Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('reports', ReportController::class);
    Route::post('/reports/{id}/submit', [ReportController::class, 'submit']);
    Route::post('/reports/{id}/approve', [ReportController::class, 'approve']);
});

require __DIR__.'/settings.php';
