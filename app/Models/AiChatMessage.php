<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiChatMessage extends Model
{
    protected $fillable = [
        'session_id','role','content','prompt_tokens','completion_tokens'
    ];

    public function session()
    {
        return $this->belongsTo(AiChatSession::class, 'session_id');
    }
}
