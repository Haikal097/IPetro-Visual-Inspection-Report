<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

use App\Http\Controllers\PhotoController;

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
});


require __DIR__.'/settings.php';
