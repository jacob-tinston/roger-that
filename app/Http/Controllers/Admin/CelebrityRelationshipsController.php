<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCelebrityRelationshipRequest;
use App\Http\Requests\Admin\UpdateCelebrityRelationshipRequest;
use App\Models\CelebrityRelationship;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CelebrityRelationshipsController extends Controller
{
    /**
     * Store a new relationship between two celebrities.
     */
    public function store(StoreCelebrityRelationshipRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        CelebrityRelationship::firstOrCreate(
            [
                'celebrity_1_id' => $validated['celebrity_1_id'],
                'celebrity_2_id' => $validated['celebrity_2_id'],
            ]
        );

        $celebrityId = $request->input('redirect_celebrity_id') ? (int) $request->input('redirect_celebrity_id') : $validated['celebrity_1_id'];

        return redirect()->route('admin.celebrities.show', $celebrityId)->with('success', 'Relationship added.');
    }

    /**
     * Update the specified relationship.
     */
    public function update(UpdateCelebrityRelationshipRequest $request, CelebrityRelationship $celebrityRelationship): RedirectResponse
    {
        $validated = $request->validated();

        if (! empty($validated)) {
            $celebrityRelationship->update([
                'celebrity_1_id' => $validated['celebrity_1_id'] ?? $celebrityRelationship->celebrity_1_id,
                'celebrity_2_id' => $validated['celebrity_2_id'] ?? $celebrityRelationship->celebrity_2_id,
            ]);
        }

        $celebrityId = $celebrityRelationship->celebrity_1_id;

        return redirect()->route('admin.celebrities.show', $celebrityId)->with('success', 'Relationship updated.');
    }

    /**
     * Remove the specified relationship.
     */
    public function destroy(Request $request, CelebrityRelationship $celebrityRelationship): RedirectResponse
    {
        $celebrityId = $request->query('redirect_celebrity_id') ? (int) $request->query('redirect_celebrity_id') : $celebrityRelationship->celebrity_1_id;

        $celebrityRelationship->delete();

        return redirect()->route('admin.celebrities.show', $celebrityId)->with('success', 'Relationship removed.');
    }
}
