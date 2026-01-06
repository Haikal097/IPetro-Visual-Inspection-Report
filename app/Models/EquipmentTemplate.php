<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentTemplate extends Model
{
    protected $table = 'equipment_templates';

    protected $fillable = [
        'user_id',
        'equipment_type',
        'title',
        'initial_finding',
        'external_finding',
        'internal_finding',
        'ndt',
        'recommendations',
        'is_global',
    ];

    protected $casts = [
        'is_global' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
