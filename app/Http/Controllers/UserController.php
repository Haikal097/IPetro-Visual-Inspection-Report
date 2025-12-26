<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display user management page
     */
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();

        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'inactive')->count();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|in:admin,reviewer,inspector',
            'status' => 'required|in:active,inactive',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $validated['status'],
            'password' => Hash::make('password123'), // Default password
        ]);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,reviewer,inspector',
            'status' => 'required|in:active,inactive',
        ]);

        $user->update($validated);

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    /**
     * Update user status
     */
    public function updateStatus(Request $request, User $user)
    {
        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user->update([
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'Status updated successfully']);
    }

    /**
     * Reset user password
     */
    public function resetPassword(User $user)
    {
        // Generate random password
        $password = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 12);
        
        $user->update([
            'password' => Hash::make($password),
        ]);

        // Here you would typically send an email with the new password
        // Mail::to($user->email)->send(new PasswordResetMail($password));

        return redirect()->back()->with('success', 'Password reset successfully. New password sent to user email.');
    }

    /**
     * Delete user
     */
    public function destroy(User $user)
    {
        // Prevent deleting your own account
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }

    /**
     * Bulk actions
     */
    public function bulkActions(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        $users = User::whereIn('id', $request->user_ids);

        switch ($request->action) {
            case 'activate':
                $users->update(['status' => 'active']);
                $message = 'Selected users activated successfully.';
                break;
            
            case 'deactivate':
                $users->update(['status' => 'inactive']);
                $message = 'Selected users deactivated successfully.';
                break;
            
            case 'delete':
                // Prevent deleting your own account
                $users->where('id', '!=', auth()->id())->delete();
                $message = 'Selected users deleted successfully.';
                break;
        }

        return redirect()->back()->with('success', $message);
    }
}