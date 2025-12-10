<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function create()
    {
        // Render Inertia page for creating a new report
        return Inertia::render('Reports/Create'); // Make sure this path matches your React component
    }
}
