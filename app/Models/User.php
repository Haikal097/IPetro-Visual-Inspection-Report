<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Add this
        'status', // Add this
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            // Optional: Add if you want role/status to be cast
            // 'role' => 'string',
            // 'status' => 'string',
        ];
    }

    /**
     * Check if user has specific role
     */
    public function hasRole($role)
    {
        return $this->role === $role;
    }
    
    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roles)
    {
        return in_array($this->role, $roles);
    }
    
    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }
    
    /**
     * Check if user is reviewer
     */
    public function isReviewer()
    {
        return $this->role === 'reviewer';
    }

    /**
     * Check if user is inspector
     */
    public function isInspector()
    {
        return $this->role === 'inspector';
    }

    /**
     * Check if user is viewer
     */
    public function isViewer()
    {
        return $this->role === 'viewer';
    }

    /**
     * Check if user is active
     */
    public function isActive()
    {
        return $this->status === 'active';
    }

    /**
     * Check if user is inactive
     */
    public function isInactive()
    {
        return $this->status === 'inactive';
    }

    /**
     * Check if user is pending
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if user is suspended
     */
    public function isSuspended()
    {
        return $this->status === 'suspended';
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include inactive users.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope a query to only include pending users.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include suspended users.
     */
    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    /**
     * Scope a query to only include users with specific role.
     */
    public function scopeRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Activate the user
     */
    public function activate()
    {
        $this->update(['status' => 'active']);
        return $this;
    }

    /**
     * Deactivate the user
     */
    public function deactivate()
    {
        $this->update(['status' => 'inactive']);
        return $this;
    }

    /**
     * Suspend the user
     */
    public function suspend()
    {
        $this->update(['status' => 'suspended']);
        return $this;
    }

    /**
     * Get the user's role with proper formatting
     */
    public function getFormattedRoleAttribute()
    {
        return ucfirst($this->role);
    }

    /**
     * Get the user's status with proper formatting
     */
    public function getFormattedStatusAttribute()
    {
        return ucfirst($this->status);
    }

    /**
     * Get the color for the user's status badge
     */
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'active' => 'green',
            'inactive' => 'gray',
            'pending' => 'yellow',
            'suspended' => 'red',
            default => 'gray',
        };
    }

    /**
     * Get the color for the user's role badge
     */
    public function getRoleColorAttribute()
    {
        return match($this->role) {
            'admin' => 'red',
            'inspector' => 'blue',
            'reviewer' => 'purple',
            'viewer' => 'gray',
            default => 'gray',
        };
    }

    /**
     * Get the user's initials for avatar
     */
    public function getInitialsAttribute()
    {
        $names = explode(' ', $this->name);
        $initials = '';
        
        foreach ($names as $name) {
            $initials .= strtoupper(substr($name, 0, 1));
        }
        
        return substr($initials, 0, 2);
    }
}