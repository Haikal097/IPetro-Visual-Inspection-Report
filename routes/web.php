<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\PhotoController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\InspectionCalendarController;
use App\Http\Controllers\ReviewerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SignatureController;
use App\Http\Controllers\ProfileController;

use App\Http\Controllers\UserController;
use App\Http\Controllers\AlbumController;
use App\Http\Controllers\Api\PhotoReportController;
use App\Http\Controllers\AiReportDraftController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

/*
|--------------------------------------------------------------------------
| Auth + Verified Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Photos
    |--------------------------------------------------------------------------
    */
    Route::get('/photo', [PhotoController::class, 'index'])->name('photo.index');
    Route::post('/upload', [PhotoController::class, 'store'])->name('upload');
    Route::post('/save-edited-image', [PhotoController::class, 'saveEditedImage'])->name('save.edited.image');
    Route::delete('/upload', [PhotoController::class, 'destroy'])->name('upload.destroy');

    Route::get('/photos/temp/{filename}', [PhotoController::class, 'getTempUrl'])->name('photos.temp-url');
    Route::get('/photos/all', [PhotoController::class, 'getAllPhotos'])->name('photos.all');

    // Optional: update / delete photo by ID (if you use it)
    Route::put('/photos/{photo}', [PhotoController::class, 'update'])->name('photos.update');
    Route::delete('/photos/{photo}', [PhotoController::class, 'destroy'])->name('photos.destroy');

    /*
    |--------------------------------------------------------------------------
    | Reports (Inspector)
    |--------------------------------------------------------------------------
    */
    Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');

    Route::get('/report', function () {
        return inertia('Reports/IndexInspector');
    })->name('reports.inspector.index');

    // Create new PV report
    Route::get('/pv-report', function () {
        return Inertia::render('Reports/PVReport', [
            'reportId' => null,
        ]);
    })->name('pv-report.create');

    // Edit existing PV report
    Route::get('/pv-report/{report}', function ($report) {
        return Inertia::render('Reports/PVReport', [
            'reportId' => $report,
        ]);
    })->name('pv-report.edit');

    /*
    |--------------------------------------------------------------------------
    | Inspection Calendar
    |--------------------------------------------------------------------------
    */
    Route::get('/inspection-calendar', [InspectionCalendarController::class, 'index'])->name('inspection.calendar');
    Route::get('/inspection-calendar/events', [InspectionCalendarController::class, 'events'])->name('inspection.calendar.events');
    Route::post('/inspection-calendar', [InspectionCalendarController::class, 'store'])->name('inspection.calendar.store');
    Route::put('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'update'])->name('inspection.calendar.update');
    Route::delete('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'destroy'])->name('inspection.calendar.destroy');

    // Old calendar page route
    Route::get('/calendar', function () {
        return Inertia::render('calendar/InspectionCalendar');
    })->name('calendar');

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
    Route::get('/notifications', [NotificationController::class, 'feed'])
        ->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::get('/notifications/feed', [NotificationController::class, 'feed'])->name('notifications.feed');
    Route::get('/notifications/stats', [NotificationController::class, 'stats'])->name('notifications.stats');

    // Keep this controller version (your earlier one)
    Route::post('/notifications/test', [NotificationController::class, 'sendTest'])
        ->middleware(['auth'])
        ->name('notifications.test');


    /*
    |--------------------------------------------------------------------------
    | Profile + Signature
    |--------------------------------------------------------------------------
    */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/stamp', [ProfileController::class, 'uploadStamp'])->name('profile.stamp');

    Route::get('/profile/signature', function () {
        return Inertia::render('Profile/Signature');
    })->name('profile.signature');

    Route::post('/profile/signature', [SignatureController::class, 'store'])
        ->name('profile.signature.store');

    /*
    |--------------------------------------------------------------------------
    | Report Finalize + Download + Verify
    |--------------------------------------------------------------------------
    */
    Route::post('/reports/{report}/finalize', [ReportController::class, 'finalize'])->name('reports.finalize');
    Route::get('/reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');
    Route::get('/verify/{token}', [ReportController::class, 'verify'])->name('reports.verify');

    /*
    |--------------------------------------------------------------------------
    | Photo Report (Page + CRUD Endpoints)
    |--------------------------------------------------------------------------
    */
    // Inertia page
    Route::get('/reports/photo-report', function () {
        return inertia('Reports/PhotoReport', [
            'reportId' => request()->query('report_id'),
        ]);
    })->name('reports.photo-report.page');

    // API-like endpoints (for Axios fetch/save)
    Route::get('/reports/{reportId}/photo-report', [PhotoReportController::class, 'getPhotoReport'])
        ->name('reports.photo-report.get');
    Route::post('/reports/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport'])
        ->name('reports.photo-report.save');
    Route::put('/reports/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport'])
        ->name('reports.photo-report.update');
    Route::delete('/reports/{reportId}/photo-report', [PhotoReportController::class, 'deletePhotoReport'])
        ->name('reports.photo-report.delete');

    /*
    |--------------------------------------------------------------------------
    | Reviewer Pages
    |--------------------------------------------------------------------------
    */
    Route::get('/review', function () {
        return inertia('Reports/IndexReviewer');
    })->name('reports.reviewer');

    Route::get('/reviewer/report', function () {
        return Inertia::render('Reviewer/Report');
    })->name('reviewer.report');

    Route::middleware(['auth'])->group(function () {
        // Review dashboard
        Route::get('/review', [ReviewerController::class, 'indexReviewer'])->name('reports.reviewer');
        
        // Individual report review
        Route::get('/reports/{report}/review', [ReviewerController::class, 'showReview'])->name('reports.showReview');
        
        // Additional review routes (optional)
        Route::get('/reports/{report}/compare', [ReviewerController::class, 'compare'])->name('reports.compare');
        Route::get('/reports/{report}/comments', [ReviewerController::class, 'comments'])->name('reports.comments');
        
        // Review actions
        Route::post('/reports/{report}/approve', [ReviewerController::class, 'approve'])->name('reports.approve');
        Route::post('/reports/{report}/reject', [ReviewerController::class, 'reject'])->name('reports.reject');
        Route::post('/reports/{report}/request-revisions', [ReviewerController::class, 'requestRevisions'])->name('reports.requestRevisions');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Routes (Role: admin)
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->middleware(['role:admin'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
        Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus'])->name('admin.users.updateStatus');
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('admin.users.resetPassword');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('/users/bulk-actions', [UserController::class, 'bulkActions'])->name('admin.users.bulkActions');
    });

    /*
    |--------------------------------------------------------------------------
    | Albums
    |--------------------------------------------------------------------------
    */
    Route::get('/albums', [AlbumController::class, 'index'])->name('albums.index');
    Route::post('/albums', [AlbumController::class, 'store'])->name('albums.store');
    Route::put('/albums/{album}', [AlbumController::class, 'update'])->name('albums.update');
    Route::delete('/albums/{album}', [AlbumController::class, 'destroy'])->name('albums.destroy');

});

/*
|--------------------------------------------------------------------------
| API Routes (used by Axios / frontend)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports/{report}', [ReportController::class, 'show']);
    Route::put('/reports/{report}', [ReportController::class, 'update']);
    Route::delete('/reports/{report}', [ReportController::class, 'destroy']);

    Route::post('/reports/{id}/submit', [ReportController::class, 'submit']);
    Route::post('/reports/{id}/approve', [ReportController::class, 'approve']);

    //ai

    Route::post('/ai/pv-report-draft', [AiReportDraftController::class, 'generatePv'])
        ->middleware(['auth'])
        ->name('ai.pv-report-draft.generate.web');


});


require __DIR__ . '/settings.php';
