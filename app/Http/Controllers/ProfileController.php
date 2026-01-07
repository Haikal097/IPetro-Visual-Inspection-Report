<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon; // ✅ ADD THIS

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Profile/Index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,

                'phone' => $user->phone,
                'company' => $user->company,
                'department' => $user->department,
                'job_title' => $user->job_title,

                'api510_cert_no' => $user->api510_cert_no,
                'dosh_reg_no' => $user->dosh_reg_no,

                'signature_url' => $user->signature_path ? asset('storage/'.$user->signature_path) : null,

                // ✅ FIX HERE:
                'signature_updated_at' => $user->signature_updated_at
                    ? Carbon::parse($user->signature_updated_at)->toISOString()
                    : null,

                'stamp_url' => $user->stamp_path ? asset('storage/'.$user->stamp_path) : null,
            ],
        ]);
    }

    // (rest unchanged)
}
