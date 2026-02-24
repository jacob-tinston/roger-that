<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            'SUBTITLES' => [
                'One man. Four women. Five guesses.',
                "You're looking for a very busy guy.",
                'Choose wisely. History will judge you.',
                "Someone's been naughty. Find him.",
                'The audacity is palpable.',
            ],
            'REACTIONS' => [
                'wrong' => [
                    'Ambitious. Incorrect.',
                    "You're circling the right energy.",
                    'He wishes!',
                    'Swing and a miss, champ.',
                    'Bold theory. Wrong human.',
                    'Not even close, but I admire the confidence.',
                ],
                'close' => [
                    'Getting warmer...',
                    "Oh, you're onto something.",
                    'The plot thickens.',
                ],
            ],
            'BUTTON_COPY' => [
                'Take a punt',
                'Bold choice',
                'Feeling lucky?',
                'Roll the dice',
                'Last roll of the dice',
            ],
            'WIN_CAPTIONS' => [
                'You absolute menace.',
                'Nailed it. Obviously.',
                "Someone's been paying attention.",
                'Knew it. Knew it.',
                'Well played, detective.',
                "You're good at this. Too good.",
                'Called it.',
                'Absolutely unhinged. We approve.',
            ],
            'WIN_SUB_CAPTIONS' => [
                'See you tomorrow, champion.',
                'Come back for more tomorrow.',
                'Another challenge awaits tomorrow.',
                'Tomorrow brings a new mystery.',
                'See you again tomorrow.',
            ],
            'LOSE_CAPTIONS' => [
                'Turns out it was him. Of course it was.',
                'Yep. Him. All along.',
                "Should've seen it coming, really.",
                'The obvious one. Classic.',
                'Him. Obviously him.',
                "That's the guy. Sorry.",
                'Of course it was him.',
            ],
            'LOSE_SUB_CAPTIONS' => [
                'Better luck tomorrow, hotshot.',
                'See you tomorrow, detective.',
                "Tomorrow's another guess.",
                'Back at it tomorrow.',
                "There's always tomorrow.",
            ],
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
