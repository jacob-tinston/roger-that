<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCelebrityRequest;
use App\Http\Requests\Admin\UpdateCelebrityRequest;
use App\Jobs\RegenerateCelebrityImage;
use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CelebritiesController extends Controller
{
    /**
     * Display the celebrities index (card view).
     */
    public function index(): Response
    {
        $celebrities = Celebrity::query()
            ->withCount(['relatedSubjects', 'relatedAnswers'])
            ->orderBy('name')
            ->get()
            ->map(function (Celebrity $celebrity) {
                return [
                    'id' => $celebrity->id,
                    'name' => $celebrity->name,
                    'birth_year' => $celebrity->birth_year,
                    'gender' => $celebrity->gender,
                    'tagline' => $celebrity->tagline,
                    'photo_url' => $celebrity->photo_url,
                    'related_subjects_count' => $celebrity->related_subjects_count,
                    'related_answers_count' => $celebrity->related_answers_count,
                    'created_at' => $celebrity->created_at->toIso8601String(),
                    'url' => route('admin.celebrities.show', $celebrity),
                ];
            });

        return Inertia::render('admin/celebrities/index', [
            'celebrities' => $celebrities->values()->all(),
        ]);
    }

    /**
     * Search celebrities by name (for relationship dropdown). Returns JSON.
     */
    public function search(Request $request): JsonResponse
    {
        $q = $request->query('q', '');
        $excludeId = $request->query('exclude');

        $celebrities = Celebrity::query()
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->when($q !== '', fn ($query) => $query->where('name', 'like', '%'.$q.'%'))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'birth_year', 'photo_url'])
            ->map(fn (Celebrity $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'birth_year' => $c->birth_year,
                'photo_url' => $c->photo_url,
            ]);

        return response()->json($celebrities->values()->all());
    }

    /**
     * Get related subjects for a celebrity (for manual game creation). Returns JSON.
     */
    public function relationships(Celebrity $celebrity): JsonResponse
    {
        $subjects = $celebrity->relatedSubjects()
            ->orderBy('name')
            ->get(['celebrities.id', 'celebrities.name', 'celebrities.birth_year', 'celebrities.photo_url'])
            ->map(fn (Celebrity $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'birth_year' => $c->birth_year,
                'photo_url' => $c->photo_url,
            ]);

        return response()->json($subjects->values()->all());
    }

    /**
     * Show the form for creating a celebrity.
     */
    public function create(): Response
    {
        return Inertia::render('admin/celebrities/create');
    }

    /**
     * Store a newly created celebrity.
     */
    public function store(StoreCelebrityRequest $request): RedirectResponse
    {
        Celebrity::create($request->validated());

        return redirect()->route('admin.celebrities.index')->with('success', 'Celebrity created successfully.');
    }

    /**
     * Display the celebrity and all their relationships.
     */
    public function show(Celebrity $celebrity): Response
    {
        $celebrity->loadMissing(['relatedSubjects', 'relatedAnswers']);

        $relationshipsAs1 = CelebrityRelationship::query()
            ->where('celebrity_1_id', $celebrity->id)
            ->with('celebrity2')
            ->get()
            ->map(function (CelebrityRelationship $rel) {
                return [
                    'id' => $rel->id,
                    'celebrity_1_id' => $rel->celebrity_1_id,
                    'celebrity_2_id' => $rel->celebrity_2_id,
                    'citation' => $rel->citation,
                    'other' => [
                        'id' => $rel->celebrity2->id,
                        'name' => $rel->celebrity2->name,
                        'birth_year' => $rel->celebrity2->birth_year,
                        'photo_url' => $rel->celebrity2->photo_url,
                    ],
                    'role' => 'answer',
                ];
            });

        $relationshipsAs2 = CelebrityRelationship::query()
            ->where('celebrity_2_id', $celebrity->id)
            ->with('celebrity1')
            ->get()
            ->map(function (CelebrityRelationship $rel) {
                return [
                    'id' => $rel->id,
                    'celebrity_1_id' => $rel->celebrity_1_id,
                    'celebrity_2_id' => $rel->celebrity_2_id,
                    'citation' => $rel->citation,
                    'other' => [
                        'id' => $rel->celebrity1->id,
                        'name' => $rel->celebrity1->name,
                        'birth_year' => $rel->celebrity1->birth_year,
                        'photo_url' => $rel->celebrity1->photo_url,
                    ],
                    'role' => 'subject',
                ];
            });

        $relationships = $relationshipsAs1->concat($relationshipsAs2)->values()->all();

        return Inertia::render('admin/celebrities/show', [
            'celebrity' => [
                'id' => $celebrity->id,
                'name' => $celebrity->name,
                'birth_year' => $celebrity->birth_year,
                'gender' => $celebrity->gender,
                'tagline' => $celebrity->tagline,
                'photo_url' => $celebrity->photo_url,
            ],
            'relationships' => $relationships,
            'celebritiesSearchUrl' => route('admin.celebrities.search'),
            'regenerateImageUrl' => route('admin.celebrities.regenerate-image', $celebrity),
        ]);
    }

    /**
     * Show the form for editing the celebrity.
     */
    public function edit(Celebrity $celebrity): Response
    {
        return Inertia::render('admin/celebrities/edit', [
            'celebrity' => [
                'id' => $celebrity->id,
                'name' => $celebrity->name,
                'birth_year' => $celebrity->birth_year,
                'gender' => $celebrity->gender,
                'tagline' => $celebrity->tagline,
                'photo_url' => $celebrity->photo_url,
            ],
        ]);
    }

    /**
     * Update the specified celebrity.
     */
    public function update(UpdateCelebrityRequest $request, Celebrity $celebrity): RedirectResponse
    {
        $celebrity->update($request->validated());

        return redirect()->route('admin.celebrities.show', $celebrity)->with('success', 'Celebrity updated successfully.');
    }

    /**
     * Remove the specified celebrity.
     */
    public function destroy(Celebrity $celebrity): RedirectResponse
    {
        CelebrityRelationship::where('celebrity_1_id', $celebrity->id)
            ->orWhere('celebrity_2_id', $celebrity->id)
            ->delete();

        $celebrity->delete();

        return redirect()->route('admin.celebrities.index')->with('success', 'Celebrity deleted successfully.');
    }

    /**
     * Queue regeneration of the celebrity's caricature image.
     */
    public function regenerateImage(Celebrity $celebrity): RedirectResponse
    {
        RegenerateCelebrityImage::dispatch($celebrity);

        return redirect()
            ->route('admin.celebrities.show', $celebrity)
            ->with('success', 'Image regeneration queued. The photo will update when the job completes.');
    }
}
