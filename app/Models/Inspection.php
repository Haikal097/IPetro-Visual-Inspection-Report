<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'tag',
        'location',
        'notes',
        'start_at',
        'end_at',
        'status',
        'remind_1d',
        'remind_1h',
        'reminded_1d_at',
        'reminded_1h_at',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'remind_1d' => 'boolean',
        'remind_1h' => 'boolean',
        'reminded_1d_at' => 'datetime',
        'reminded_1h_at' => 'datetime',
    ];
}
