<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL'),
        'image_model' => env('OPENAI_IMAGE_MODEL', 'dall-e-3'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Node.js path for game agent scripts
    |--------------------------------------------------------------------------
    | When running game generation from the admin (web), the PHP process may
    | not have 'node' in PATH. Set NODE_PATH to the full path to node (e.g.
    | /opt/homebrew/bin/node or /usr/local/bin/node) if you see "command not
    | found" or script failures only from the admin and not from CLI.
    */
    'node_path' => env('NODE_PATH', 'node'),

];
