<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipmentTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EquipmentTemplateController extends Controller
{
    /**
     * List templates available to current user:
     * - global templates
     * - user's own templates
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $templates = EquipmentTemplate::query()
            ->where(function ($q) use ($userId) {
                $q->where('is_global', true)
                  ->orWhere('user_id', $userId);
            })
            ->orderBy('equipment_type')
            ->orderBy('title')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Store new template (user template by default)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'equipment_type'   => ['required', 'string', 'max:120'],
            'title'            => ['nullable', 'string', 'max:180'],
            'initial_finding'  => ['nullable', 'string'],
            'external_finding' => ['nullable', 'string'],
            'internal_finding' => ['nullable', 'string'],
            'ndt'              => ['nullable', 'string'],
            'recommendations'  => ['nullable', 'string'],
            'is_global'        => ['sometimes', 'boolean'], // keep, but you can restrict to admin later
        ]);

        // Force ownership
        $data['user_id'] = $request->user()->id;

        // Optional: if you want ONLY admin can create global templates, uncomment:
        // if (!($request->user()->role === 'admin')) {
        //     $data['is_global'] = false;
        // }

        $template = EquipmentTemplate::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Template created',
            'data' => $template,
        ], 201);
    }

    /**
     * Show one template
     */
    public function show(Request $request, $id)
    {
        $userId = $request->user()->id;

        $template = EquipmentTemplate::query()
            ->where('id', $id)
            ->where(function ($q) use ($userId) {
                $q->where('is_global', true)
                  ->orWhere('user_id', $userId);
            })
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $template,
        ]);
    }

    /**
     * Update template (only owner; global should be admin-only)
     */
    public function update(Request $request, $id)
    {
        $template = EquipmentTemplate::findOrFail($id);

        // permission: owner OR admin
        $user = $request->user();
        $isOwner = (int)$template->user_id === (int)$user->id;
        $isAdmin = strtolower((string)($user->role ?? '')) === 'admin';

        if (!$isOwner && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        // Optional: block non-admin from editing global templates
        if ($template->is_global && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'equipment_type'   => ['required', 'string', 'max:120'],
            'title'            => ['nullable', 'string', 'max:180'],
            'initial_finding'  => ['nullable', 'string'],
            'external_finding' => ['nullable', 'string'],
            'internal_finding' => ['nullable', 'string'],
            'ndt'              => ['nullable', 'string'],
            'recommendations'  => ['nullable', 'string'],
            'is_global'        => ['sometimes', 'boolean'],
        ]);

        // Optional: only admin can toggle global
        if (!$isAdmin) {
            unset($data['is_global']);
        }

        $template->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Template updated',
            'data' => $template,
        ]);
    }

    /**
     * Delete template (only owner; global admin-only)
     */
    public function destroy(Request $request, $id)
    {
        $template = EquipmentTemplate::findOrFail($id);

        $user = $request->user();
        $isOwner = (int)$template->user_id === (int)$user->id;
        $isAdmin = strtolower((string)($user->role ?? '')) === 'admin';

        if (!$isOwner && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        if ($template->is_global && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template deleted',
        ]);
    }
}
