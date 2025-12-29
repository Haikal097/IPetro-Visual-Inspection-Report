<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Models\Photo;
use App\Models\Album;

class PhotoController extends Controller
{
    /**
     * Photos page
     */
    public function index()
    {
        return Inertia::render('Photos/Index');
    }

    /**
     * Upload new photo (store file + DB record)
     * POST /upload
     */
    public function store(Request $request)
    {
        $request->validate([
            'file'     => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            'album_id' => 'nullable|integer',
        ]);

        $userId = $request->user()->id;

        // ✅ if album_id provided, confirm album belongs to user
        $albumId = $request->input('album_id');
        if ($albumId) {
            $exists = Album::where('id', $albumId)->where('user_id', $userId)->exists();
            if (!$exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid album.',
                ], 422);
            }
        } else {
            $albumId = null;
        }

        try {
            $file = $request->file('file');
            $path = $file->store('photos', 'public');

            $photo = Photo::create([
                'user_id'  => $userId,
                'album_id' => $albumId,
                'name'     => $file->getClientOriginalName(),
                'path'     => $path,
                'size'     => $file->getSize() ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully!',
                'photo'   => $photo,
                'path'    => $photo->path,
                'url'     => $photo->url,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save edited image (base64 → file + DB record)
     * POST /save-edited-image
     */
    public function saveEditedImage(Request $request)
    {
        $request->validate([
            'image'    => 'required|string',
            'filename' => 'required|string',
            'album_id' => 'nullable|integer',
        ]);

        $userId = $request->user()->id;

        // ✅ validate album belongs to user if provided
        $albumId = $request->input('album_id');
        if ($albumId) {
            $exists = Album::where('id', $albumId)->where('user_id', $userId)->exists();
            if (!$exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid album.',
                ], 422);
            }
        } else {
            $albumId = null;
        }

        try {
            $imageData = $request->input('image');

            // detect extension
            $extension = 'png';
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
                $extension = $matches[1];
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
            }

            $binary = base64_decode($imageData);
            if ($binary === false) {
                throw new \Exception('Invalid base64 image data');
            }

            $filename = 'edited_' . time() . '.' . $extension;
            $path = 'photos/edited/' . $filename;

            Storage::disk('public')->put($path, $binary);

            $photo = Photo::create([
                'user_id'  => $userId,
                'album_id' => $albumId,
                'name'     => $filename,
                'path'     => $path,
                'size'     => strlen($binary),
            ]);

            return response()->json([
                'success'  => true,
                'message'  => 'Edited image saved successfully!',
                'photo'    => $photo,
                'path'     => $photo->path,
                'url'      => $photo->url,
                'filename' => $filename,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save edited image: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ List all photos + albums (filters + sort + search)
     * GET /photos/all?album_id=null|{id}&sort=created_at|name|size&dir=asc|desc&q=
     */
    public function getAllPhotos(Request $request)
    {
        $userId = $request->user()->id;

        // albums for folder dropdown
        $albums = Album::where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);

        $query = Photo::where('user_id', $userId);

        // album filter
        if ($request->has('album_id')) {
            if ($request->album_id === 'null') {
                $query->whereNull('album_id');
            } else if ($request->album_id !== '') {
                $query->where('album_id', (int) $request->album_id);
            }
        }

        // search by name
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where('name', 'like', "%{$q}%");
        }

        // sort
        $sort = $request->get('sort', 'created_at');
        $dir  = $request->get('dir', 'desc');

        if (!in_array($sort, ['created_at', 'name', 'size'], true)) $sort = 'created_at';
        if (!in_array($dir, ['asc', 'desc'], true)) $dir = 'desc';

        $photos = $query->orderBy($sort, $dir)->get();

        return response()->json([
            'success' => true,
            'albums'  => $albums,
            'photos'  => $photos,
        ]);
    }

    /**
     * Move / rename photo
     * PUT /photos/{photo}
     */
    public function update(Request $request, Photo $photo)
    {
        $userId = $request->user()->id;
        abort_unless($photo->user_id === $userId, 403);

        $request->validate([
            'name'     => 'nullable|string|max:120',
            'album_id' => 'nullable|integer',
        ]);

        // rename
        if ($request->has('name')) {
            $photo->name = $request->name;
        }

        // move folder (album_id can be null = unsorted)
        if ($request->has('album_id')) {
            $albumId = $request->input('album_id');

            if ($albumId) {
                // ✅ ensure album belongs to user
                $exists = Album::where('id', $albumId)->where('user_id', $userId)->exists();
                if (!$exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid album.',
                    ], 422);
                }
                $photo->album_id = $albumId;
            } else {
                $photo->album_id = null; // unsorted
            }
        }

        $photo->save();

        return response()->json([
            'success' => true,
            'photo'   => $photo,
        ]);
    }

    /**
     * Delete photo (file + DB)
     * DELETE /photos/{photo}
     */
    public function destroy(Request $request, Photo $photo)
    {
        $userId = $request->user()->id;
        abort_unless($photo->user_id === $userId, 403);

        try {
            if ($photo->path && Storage::disk('public')->exists($photo->path)) {
                Storage::disk('public')->delete($photo->path);
            }

            $photo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Photo deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
