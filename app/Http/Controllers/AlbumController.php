<?php

namespace App\Http\Controllers;

use App\Models\Album;
use Illuminate\Http\Request;

class AlbumController extends Controller
{
    public function index(Request $request)
    {
        $albums = Album::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'albums' => $albums]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:80',
        ]);

        $album = Album::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
        ]);

        return response()->json([
            'success' => true,
            'album' => $album,
        ]);
    }

    public function update(Request $request, Album $album)
    {
        abort_unless($album->user_id === auth()->id(), 403);

        $request->validate([
            'name' => 'required|string|max:80',
        ]);

        $album->update(['name' => $request->name]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, Album $album)
    {
        abort_unless($album->user_id === $request->user()->id, 403);

        // keep photos, just unassign folder
        $album->photos()->update(['album_id' => null]);
        $album->delete();

        return response()->json(['success' => true]);
    }
}
