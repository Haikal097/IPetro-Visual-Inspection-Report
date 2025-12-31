<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

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
                'signature_updated_at' => $user->signature_updated_at?->toISOString(),

                'stamp_url' => $user->stamp_path ? asset('storage/'.$user->stamp_path) : null,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'phone' => ['nullable','string','max:30'],
            'company' => ['nullable','string','max:120'],
            'department' => ['nullable','string','max:120'],
            'job_title' => ['nullable','string','max:120'],
            'api510_cert_no' => ['nullable','string','max:80'],
            'dosh_reg_no' => ['nullable','string','max:80'],
        ]);

        $user = $request->user();
        $user->fill($data)->save();

        return back()->with('success', 'Profile updated.');
    }

    public function uploadStamp(Request $request)
    {
        $request->validate([
            'stamp' => ['required','image','mimes:png,jpg,jpeg','max:2048'],
        ]);

        $user = $request->user();

        // delete old
        if ($user->stamp_path && Storage::disk('public')->exists($user->stamp_path)) {
            Storage::disk('public')->delete($user->stamp_path);
        }

        $path = $request->file('stamp')->store("stamps/{$user->id}", 'public');
        $user->stamp_path = $path;
        $user->save();

        return back()->with('success', 'Stamp uploaded.');
    }
}
