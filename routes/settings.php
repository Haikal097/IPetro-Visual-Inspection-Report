<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {

    // ✅ ADD: prefix route names inside this file so they won't clash with /profile route names
    Route::as('settings.')->group(function () {

        Route::redirect('settings', '/settings/profile');

        // ✅ same URLs, just names become:
        // settings.profile.edit, settings.profile.update, settings.profile.destroy
        Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        // ✅ names become:
        // settings.user-password.edit, settings.user-password.update
        Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

        Route::put('settings/password', [PasswordController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('user-password.update');

        // ✅ name becomes:
        // settings.appearance.edit
        Route::get('settings/appearance', function () {
            return Inertia::render('settings/appearance');
        })->name('appearance.edit');

        // ✅ name becomes:
        // settings.two-factor.show
        Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
            ->name('two-factor.show');

    }); // ✅ ADD: close settings. name prefix group

});
