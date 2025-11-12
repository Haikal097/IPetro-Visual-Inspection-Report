<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function index()
    {
        return Inertia::render('Photos/Index',[]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        try {
            $path = $request->file('file')->store('photos', 'public');
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully!',
                'path' => $path,
                'url' => $url,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // New method to save edited images
    public function saveEditedImage(Request $request)
    {
        $request->validate([
            'image' => 'required|string',
            'filename' => 'required|string',
        ]);

        try {
            $imageData = $request->input('image');
            
            // Extract base64 data and get extension
            $extension = '.png'; // default extension
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $extension = '.' . $matches[1];
            }

            $imageData = base64_decode($imageData);

            if ($imageData === false) {
                throw new \Exception('Invalid base64 image data');
            }

            $originalName = pathinfo($request->input('filename'), PATHINFO_FILENAME);
            $filename = 'edited_' . time() . '_' . $originalName . $extension;
            $path = 'photos/edited/' . $filename;

            // Save to cloud storage (persistent)
            Storage::disk('s3')->put($path, $imageData, 'public');
            $url = Storage::disk('s3')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Edited image saved successfully!',
                'path' => $path,
                'url' => $url,
                'filename' => $filename,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save edited image: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        try {
            $filePath = $request->getContent();
            
            if (str_contains($filePath, 'storage/')) {
                $filePath = str_replace('/storage/', '', $filePath);
            }

            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getTempUrl($filename)
    {
        $path = "photos/{$filename}";
        if (Storage::disk('public')->exists($path)) {
            $url = Storage::disk('public')->url($path);
            return response()->json(['url' => $url]);
        }
        
        return response()->json(['error' => 'File not found'], 404);
    }

    public function getAllPhotos()
    {
        try {
            $files = Storage::disk('public')->files('photos');
            
            $photos = [];
            foreach ($files as $file) {
                if (in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $photos[] = [
                        'name' => basename($file),
                        'path' => $file,
                        'url' => Storage::disk('public')->url($file),
                        'size' => Storage::disk('public')->size($file),
                        'last_modified' => Storage::disk('public')->lastModified($file),
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'photos' => $photos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch photos: ' . $e->getMessage()
            ], 500);
        }
    }
}