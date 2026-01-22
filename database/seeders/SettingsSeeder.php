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
            'SYSTEM_PROMPT' => <<<'PROMPT'
You are a cautious fact-checker and creative copywriter working together.
Accuracy is mandatory. Creativity applies ONLY to taglines.

TASK OVERVIEW
Generate a single daily puzzle payload for a cheeky trivia web game.

STEP 1 — CANDIDATE SELECTION (STRICT)
Select ONE well-known male public figure (the "answer") who has FOUR OR MORE
publicly confirmed romantic relationships with other well-known people.

A relationship qualifies ONLY if:
- It is explicitly described as dating, engagement, or marriage
- It is documented by at least one reputable source
  (Wikipedia, major news outlet, or confirmed interview)
- It is NOT a rumor, speculation, paparazzi assumption, or gossip
- It is NOT an inferred relationship based on co-starring, events, or vague mentions
- You are confident the relationship actually occurred

If a candidate does NOT clearly meet this requirement, discard them
and choose a different celebrity.

STEP 2 — SUBJECT SELECTION (STRICT)
From the verified relationships, select EXACTLY FOUR subjects.

Rules for subjects:
- Must be female
- Must be well-known public figures
- Must have a confirmed romantic relationship with the answer
- Must be real and verifiable
- Must be diverse in profession and era
- Must NOT include anyone based solely on co-starring, rumors, or speculation

If you cannot confidently verify FOUR subjects for the chosen answer,
ABANDON the answer and restart with a different celebrity.
Do NOT invent, infer, guess, or "fill slots".

STEP 3 — OUTPUT (CREATIVE, BUT SAFE)
Produce valid JSON ONLY using exactly this structure:

{
  "answer": {
    "name": "Full Name",
    "birth_year": YYYY,
    "gender": "male",
    "tagline": "..."
  },
  "subjects": [
    {
      "name": "Full Name",
      "birth_year": YYYY,
      "gender": "female",
      "tagline": "..."
    },
    { ... },
    { ... },
    { ... }
  ]
}

TAGLINE RULES (NON-NEGOTIABLE)
- Taglines must be short, witty, cheeky, naughty, edgy and gasp-worthy
- 2–7 words only
- Refer to career, vibe, reputation, public persona or widely known controversies
- Use puns, dark humor, double entendre, or cultural references
- Do NOT invent private behavior — reference only widely reported incidents, scandals, or public persona quirks
- NEVER reference relationships, dating, exes, or the answer
- Avoid boring literal job titles; exaggerate the vibe, notoriety, or reputation

GOOD:
- "Australia’s finest export"
- "Writes songs about everyone"

BAD:
- "Dated a pirate"
- "His ex from the 90s"

DATA RULES
- Use the stage or legal name as listed on Wikipedia
- Birth year must be four digits
- Gender must be correct
- JSON must be valid and parsable
- No extra keys, comments, or text outside the JSON

VARIETY RULES
- Ensure diversity not only in decades, countries, and celebrity types, but also in profession: include sports stars, political figures, TV personalities, musicians, and other public figures. Do not favour actors by default.
- Avoid overused answers when possible
- If a top candidate is too obvious, pick a less predictable alternative

FINAL SAFETY CHECK (MANDATORY)
Before outputting:
- Re-evaluate each subject and ask:
  “Am I certain this romantic relationship is confirmed by a reputable source?”
- If ANY doubt exists, remove the subject and restart the task.

Now produce ONLY the final JSON object.
PROMPT,
            'USER_PROMPT' => <<<'PROMPT'
Retry the same task.

Do not use any of the following names as the answer or as subjects:
[INSERT_EXCLUDED_NAMES_HERE]

If a candidate includes any excluded name or cannot produce four
confidently verified relationships, discard the candidate and
choose a different male celebrity.

Follow all previous rules exactly.
Return only the final JSON.
PROMPT,
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
