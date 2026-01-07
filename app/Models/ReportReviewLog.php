<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportReviewLog extends Model
{
    protected $table = 'report_review_logs';

    protected $fillable = [
        'report_id',
        'reviewer_id',
        'action',
        'message',
    ];
}
