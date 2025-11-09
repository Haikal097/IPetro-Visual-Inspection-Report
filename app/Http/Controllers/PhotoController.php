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
            'image' => 'required|string', // base64 image data
            'filename' => 'required|string',
        ]);

        try {
            // Extract the base64 image data
            $imageData = $request->input('image');
            
            // Remove the data:image/png;base64, part if present
            if (strpos($imageData, ';base64,') !== false) {
                list($type, $imageData) = explode(';', $imageData);
                list(, $imageData) = explode(',', $imageData);
            }

            // Decode the base64 data
            $imageData = base64_decode($imageData);

            // Generate filename
            $filename = 'edited_' . time() . '_' . $request->input('filename');
            $path = 'photos/edited/' . $filename;

            // Save the image to storage
            Storage::disk('public')->put($path, $imageData);

            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Edited image saved successfully!',
                'path' => $path,
                'url' => $url,
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
}