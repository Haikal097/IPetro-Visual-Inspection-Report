<?php

// app/Models/AiReportDraft.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiReportDraft extends Model
{
    protected $fillable = [
        'user_id','report_id','provider','model','status',
        'input_payload','output_draft'
    ];

    protected $casts = [
        'input_payload' => 'array',
        'output_draft'  => 'array',
    ];
}
