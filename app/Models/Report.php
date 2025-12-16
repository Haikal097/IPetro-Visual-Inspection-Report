<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Report extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'reports';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'report_id';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'int';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'creator_id',
        'reviewer_id',
        'status',
        'creation_date',
        'submission_date',
        'json_data',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'creation_date' => 'datetime',
        'submission_date' => 'datetime',
        'json_data' => 'array',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array<int, string>
     */
    protected $dates = [
        'creation_date',
        'submission_date',
        'created_at',
        'updated_at',
    ];

    /**
     * Get the creator of the report.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get the reviewer of the report.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Accessor for convenient form data access.
     */
    protected function formData(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->json_data ?? [],
            set: fn ($value) => ['json_data' => $value]
        );
    }

    /**
     * Accessor for equipment tag from json_data.
     */
    protected function equipmentTag(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->json_data['equipmentTag'] ?? null
        );
    }

    /**
     * Accessor for equipment description from json_data.
     */
    protected function equipmentDescription(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->json_data['equipmentDescription'] ?? null
        );
    }

    /**
     * Accessor for equipment type from json_data.
     */
    protected function equipmentType(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->json_data['equipmentType'] ?? null
        );
    }

    /**
     * Accessor for report number from json_data.
     */
    protected function reportNo(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->json_data['reportNo'] ?? null
        );
    }

    /**
     * Scope a query to only include draft reports.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope a query to only include submitted reports.
     */
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    /**
     * Scope a query to only include approved reports.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include reports for a specific creator.
     */
    public function scopeByCreator($query, $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    /**
     * Scope a query to only include reports pending review.
     */
    public function scopePendingReview($query)
    {
        return $query->where('status', 'submitted')->orWhere('status', 'in_review');
    }

    /**
     * Check if the report is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the report is submitted.
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    /**
     * Check if the report is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Submit the report for review.
     */
    public function submit(): bool
    {
        return $this->update([
            'status' => 'submitted',
            'submission_date' => now()
        ]);
    }

    /**
     * Approve the report.
     */
    public function approve($reviewerId): bool
    {
        return $this->update([
            'status' => 'approved',
            'reviewer_id' => $reviewerId
        ]);
    }

    /**
     * Reject the report.
     */
    public function reject($reviewerId, $feedback = null): bool
    {
        // Store feedback in json_data
        $jsonData = $this->json_data ?? [];
        $jsonData['rejection_feedback'] = $feedback;
        
        return $this->update([
            'status' => 'rejected',
            'reviewer_id' => $reviewerId,
            'json_data' => $jsonData
        ]);
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function ($report) {
            if (empty($report->creation_date)) {
                $report->creation_date = now();
            }
        });
    }
}