<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Album extends Model
{
  protected $fillable = ['user_id', 'name'];

  public function user(): BelongsTo {
    return $this->belongsTo(User::class);
  }

  public function photos(): HasMany {
    return $this->hasMany(Photo::class);
  }
}
