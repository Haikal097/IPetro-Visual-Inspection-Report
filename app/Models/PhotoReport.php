<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PhotoReport extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'photo_reports';

    protected $fillable = [
        'report_id',
        'report_title',
        'report_number',
        'inspection_date',
        'pmt',
        'tag',
        'description',
        'plant_unit',
        'report_data',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'report_data' => 'array',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the main report that owns this photo report
     */
    public function report()
    {
        // Match your Report model's primary key 'report_id'
        return $this->belongsTo(Report::class, 'report_id', 'report_id');
    }

    /**
     * Scope to find by report_id
     */
    public function scopeByReportId($query, $reportId)
    {
        return $query->where('report_id', $reportId);
    }

    /**
     * Get the creator through the report relationship
     */
    public function creator()
    {
        return $this->hasOneThrough(
            User::class,
            Report::class,
            'report_id', // Foreign key on reports table
            'id',        // Foreign key on users table
            'report_id', // Local key on photo_reports table
            'creator_id' // Local key on reports table
        );
    }
}