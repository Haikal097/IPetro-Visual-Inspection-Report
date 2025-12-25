<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SignatureController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'signature_data' => ['required', 'string'],
        ]);

        $user = $request->user();
        $data = $request->input('signature_data');

        // data:image/png;base64,xxxx
        if (!str_starts_with($data, 'data:image/png;base64,')) {
            return back()->withErrors(['signature_data' => 'Invalid signature format.']);
        }

        $png = base64_decode(substr($data, strlen('data:image/png;base64,')));

        if ($png === false) {
            return back()->withErrors(['signature_data' => 'Signature decode failed.']);
        }

        $path = "signatures/{$user->id}/signature.png";
        Storage::disk('public')->put($path, $png);

        $user->signature_path = $path;
        $user->signature_updated_at = now();
        $user->save();

        return back()->with('success', 'Signature saved.');
    }
}
