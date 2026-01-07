<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Report;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role !== 'inspector') {
            return redirect()->to(match ($user->role) {
                'admin' => '/admin/users',
                'reviewer' => '/review',
                default => '/',
            });
        }

        $reports = Report::with(['creator', 'reviewer'])
            ->orderBy('creation_date', 'desc')
            ->get();

        return Inertia::render('dashboard', [
            'reports' => $reports
        ]);
    }
}