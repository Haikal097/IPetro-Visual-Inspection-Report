<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Report;

class DashboardController extends Controller
{
    public function index()
    {
        $reports = Report::with(['creator', 'reviewer'])
            ->orderBy('creation_date', 'desc')
            ->get();

        return Inertia::render('Dashboard', [
            'reports' => $reports
        ]);
    }
}