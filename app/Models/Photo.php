<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Photo extends Model
{
  protected $fillable = ['user_id', 'album_id', 'name', 'path', 'size'];

  protected $appends = ['url'];

  public function getUrlAttribute(): string {
    return Storage::url($this->path);
  }

  public function user(): BelongsTo {
    return $this->belongsTo(User::class);
  }

  public function album(): BelongsTo {
    return $this->belongsTo(Album::class);
  }
}
