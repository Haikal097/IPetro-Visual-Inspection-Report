<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\DashboardController;
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
use App\Http\Controllers\Api\EquipmentTemplateController;
use App\Http\Controllers\Api\InspectorAiController;
use App\Http\Controllers\AiInspectorChatController;
use App\Http\Controllers\Api\AiDashboardAnalysisController;

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
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Photos (Inspector Only)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'role:inspector'])->group(function () {
        Route::get('/photo', [PhotoController::class, 'index'])->name('photo.index');
        Route::post('/upload', [PhotoController::class, 'store'])->name('upload');
        Route::post('/save-edited-image', [PhotoController::class, 'saveEditedImage'])->name('save.edited.image');
        Route::delete('/upload', [PhotoController::class, 'destroy'])->name('upload.destroy');

        Route::get('/photos/temp/{filename}', [PhotoController::class, 'getTempUrl'])->name('photos.temp-url');
        Route::get('/photos/all', [PhotoController::class, 'getAllPhotos'])->name('photos.all');

        Route::put('/photos/{photo}', [PhotoController::class, 'update'])->name('photos.update');
        Route::delete('/photos/{photo}', [PhotoController::class, 'destroy'])->name('photos.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Reports (Inspector Only)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'role:inspector'])->group(function () {
        Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');

        // ✅ FIX (necessary): /report previously rendered page without props (causes buttons to feel broken)
        // Keep route for backward compatibility but redirect to correct page
        Route::get('/report', function () {
            return redirect('/reports');
        })->name('reports.inspector.index');

        // ✅ Correct inspector reports list with props
        Route::get('/reports', [ReportController::class, 'reportsPage'])->name('reports.page');

        // ✅ Inspector Resubmit (should be accessible to inspector, not inside reviewer-only group)
        Route::post('/reports/{report}/resubmit', [ReportController::class, 'resubmit'])->name('reports.resubmit');

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
    });

    /*
    |--------------------------------------------------------------------------
    | ✅ Equipment Templates (Inertia Page) - Inspector Only
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'role:inspector'])->group(function () {
        Route::get('/equipment-templates', function () {
            return Inertia::render('EquipmentTemplates/Index');
        })->name('equipment-templates.index');
    });

    /*
    |--------------------------------------------------------------------------
    | Inspection Calendar - Inspector Only
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'role:inspector'])->group(function () {
        Route::get('/inspection-calendar', [InspectionCalendarController::class, 'index'])->name('inspection.calendar');
        Route::get('/inspection-calendar/events', [InspectionCalendarController::class, 'events'])->name('inspection.calendar.events');
        Route::post('/inspection-calendar', [InspectionCalendarController::class, 'store'])->name('inspection.calendar.store');
        Route::put('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'update'])->name('inspection.calendar.update');
        Route::delete('/inspection-calendar/{inspection}', [InspectionCalendarController::class, 'destroy'])->name('inspection.calendar.destroy');

        Route::get('/calendar', function () {
            return Inertia::render('calendar/InspectionCalendar');
        })->name('calendar');
    });
    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
    Route::get('/notifications', [NotificationController::class, 'feed'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::get('/notifications/feed', [NotificationController::class, 'feed'])->name('notifications.feed');
    Route::get('/notifications/stats', [NotificationController::class, 'stats'])->name('notifications.stats');

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
    Route::get('/reports/photo-report', function () {
        return inertia('Reports/PhotoReport', [
            'reportId' => request()->query('report_id'),
        ]);
    })->name('reports.photo-report.page');

    Route::get('/reports/photo-report/print', function () {
        return Inertia::render('PhotoReportPrint');
    })->name('photo-report.print');

    Route::get('/reports/{reportId}/photo-report', [PhotoReportController::class, 'getPhotoReport'])
        ->name('reports.photo-report.get');
    Route::post('/reports/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport'])
        ->name('reports.photo-report.save');
    Route::put('/reports/{reportId}/photo-report', [PhotoReportController::class, 'savePhotoReport'])
        ->name('reports.photo-report.update');
    Route::delete('/reports/{reportId}/photo-report', [PhotoReportController::class, 'deletePhotoReport'])
        ->name('reports.photo-report.delete');
    Route::post('/reports/{reportId}/photo-report/submit', [PhotoReportController::class, 'submitPhotoReport'])
        ->name('reports.photo-report.submit');

    /*
    |--------------------------------------------------------------------------
    | Reviewer Pages (Reviewer Only)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'role:reviewer'])->group(function () {
        // ✅ keep ONE review index route
        Route::get('/review', [ReviewerController::class, 'indexReviewer'])->name('reports.reviewer');

        // Approve/Rejected reports page
        Route::get('/reviewapproved', [ReviewerController::class, 'approvedPage'])->name('review.approved');
        Route::get('/reviewrejected', [ReviewerController::class, 'rejectedPage'])->name('review.rejected');

        Route::get('/reviewer/report', function () {
            return Inertia::render('Reviewer/Report');
        })->name('reviewer.report');

        Route::get('/reports/{report}/compare', [ReviewerController::class, 'compare'])->name('reports.compare');
        Route::get('/reports/{report}/comments', [ReviewerController::class, 'comments'])->name('reports.comments');

        // ✅ review actions (only once)
        Route::post('/review/{report}/approve', [ReviewerController::class, 'approve'])->name('review.approve');
        Route::post('/review/{report}/reject', [ReviewerController::class, 'reject'])->name('review.reject');
        Route::post('/review/{report}/request-revision', [ReviewerController::class, 'requestRevision'])->name('review.requestRevision');
    });
    /*
    
    |--------------------------------------------------------------------------
    | Single report page (Reviewer and Inspector)
    |--------------------------------------------------------------------------
    */
    
        Route::get('/report/show/{report}', [ReviewerController::class, 'showReview'])->name('reports.showReview');

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


    /*
    |--------------------------------------------------------------------------
    | Report Fix
    |--------------------------------------------------------------------------
    */
    Route::get('/reports/{report}/edit', [ReportController::class, 'edit'])
    ->name('reports.edit');

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

    // ai draft
    Route::post('/ai/pv-report-draft', [AiReportDraftController::class, 'generatePv'])
        ->name('ai.pv-report-draft.generate.web');

    // inspector chat (choose one controller)
    Route::post('/ai/inspector-chat', [AiInspectorChatController::class, 'chat'])
    ->name('ai.inspector-chat');


    // report analysis
    Route::post('/ai/report-analysis', [InspectorAiController::class, 'analyze'])
        ->name('ai.report.analysis');

    // dashboard analysis (use invoke controller)
    Route::post('/ai/dashboard-analysis', AiDashboardAnalysisController::class)
        ->name('ai.dashboard-analysis');

    /*
    |----------------------------------------------------------------------
    | ✅ Equipment Template API Routes (Axios should call /api/equipment-templates)
    |----------------------------------------------------------------------
    */
    Route::get('/equipment-templates', [EquipmentTemplateController::class, 'index']);
    Route::post('/equipment-templates', [EquipmentTemplateController::class, 'store']);
    Route::get('/equipment-templates/{id}', [EquipmentTemplateController::class, 'show']);
    Route::put('/equipment-templates/{id}', [EquipmentTemplateController::class, 'update']);
    Route::delete('/equipment-templates/{id}', [EquipmentTemplateController::class, 'destroy']);
});

require __DIR__ . '/settings.php';
