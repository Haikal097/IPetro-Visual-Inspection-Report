<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiReportReview extends Model
{
    protected $fillable = [
        'user_id',
        'report_id',
        'provider',
        'model',
        'status',
        'input_payload',
        'output_review',
    ];

    protected $casts = [
        'input_payload' => 'array',
        'output_review' => 'array',
    ];
}
