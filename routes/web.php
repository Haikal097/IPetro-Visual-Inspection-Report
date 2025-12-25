<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\PhotoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;

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
    Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');
    Route::get('/report', function () {
        return inertia('Reports/IndexInspector');
    });
    Route::get('/pv-report', function () {
        return Inertia::render('Reports/PVReport');
    });

Route::get('/admin', function () {
    return inertia('Admin/Index', [
        'users' => [
            // Make sure this array exists
            [
                'id' => 1,
                'name' => 'Test User',
                'email' => 'test@ipetro.com',
                'role' => 'admin',
                'status' => 'active',
                'lastLogin' => 'Today'
            ]
        ],
        'stats' => [
            'totalUsers' => 1,
            'activeUsers' => 1,
            'newUsers' => 0,
            'pendingUsers' => 0
        ]
    ]);
});
Route::get('/admin/users', function () {
    $users = [
        [
            'id' => 1,
            'name' => 'John Anderson',
            'email' => 'john.anderson@ipetro.com',
            'phone' => '+1 (555) 123-4567',
            'role' => 'admin',
            'status' => 'active',
            'lastLogin' => 'Today, 9:42 AM',
            'createdAt' => '2024-01-15',
            'lastActive' => '2 minutes ago',
            'avatarColor' => '#CD202C'
        ],
        [
            'id' => 2,
            'name' => 'Sarah Johnson',
            'email' => 'sarah.johnson@ipetro.com',
            'phone' => '+1 (555) 987-6543',
            'role' => 'inspector',
            'status' => 'active',
            'lastLogin' => 'Yesterday, 3:20 PM',
            'createdAt' => '2024-01-10',
            'lastActive' => '1 hour ago',
            'avatarColor' => '#1e40af'
        ],
        // Add more users...
    ];

    return inertia('Admin/Users', [
        'users' => $users,
        'totalUsers' => count($users),
        'activeUsers' => 2,
        'newUsersThisMonth' => 1,
        'inactiveUsers' => 0
    ]);
})->name('admin.users');

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
