<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiChatSession extends Model
{
    protected $fillable = [
        'user_id','title','provider','model','status','context','last_message_at'
    ];

    protected $casts = [
        'context' => 'array',
        'last_message_at' => 'datetime',
    ];

    public function messages()
    {
        return $this->hasMany(AiChatMessage::class, 'session_id');
    }
}
