<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportAudit extends Model
{
    protected $fillable = ['report_id', 'user_id', 'action', 'meta'];
    protected $casts = ['meta' => 'array'];
}
