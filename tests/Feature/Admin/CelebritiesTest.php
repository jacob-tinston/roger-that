<?php

use App\Jobs\RegenerateCelebrityImage;
use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    Role::create(['name' => 'Admin']);
    Role::create(['name' => 'User']);
    $this->admin = User::factory()->create(['role_id' => 1]);
});

test('admin can view celebrities index', function (): void {
    Celebrity::factory()->count(2)->create();

    $response = $this->actingAs($this->admin)->get(route('admin.celebrities.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/celebrities/index')
        ->has('celebrities', 2)
    );
});

test('admin can create a celebrity', function (): void {
    $response = $this->actingAs($this->admin)->post(route('admin.celebrities.store'), [
        'name' => 'Test Celebrity',
        'birth_year' => 1990,
        'gender' => 'female',
        'tagline' => 'A tagline',
        'photo_url' => null,
    ]);

    $response->assertRedirect(route('admin.celebrities.index'));
    $this->assertDatabaseHas('celebrities', [
        'name' => 'Test Celebrity',
        'birth_year' => 1990,
        'gender' => 'female',
    ]);
});

test('admin can view a celebrity show page with relationships', function (): void {
    $celebrity = Celebrity::factory()->create();

    $response = $this->actingAs($this->admin)->get(route('admin.celebrities.show', $celebrity));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/celebrities/show')
        ->where('celebrity.id', $celebrity->id)
        ->has('relationships')
        ->has('celebritiesSearchUrl')
        ->has('regenerateImageUrl')
    );
});

test('admin can update a celebrity', function (): void {
    $celebrity = Celebrity::factory()->create(['name' => 'Original Name']);

    $response = $this->actingAs($this->admin)->put(route('admin.celebrities.update', $celebrity), [
        'name' => 'Updated Name',
        'birth_year' => $celebrity->birth_year,
        'gender' => $celebrity->gender,
        'tagline' => $celebrity->tagline,
        'photo_url' => $celebrity->photo_url,
    ]);

    $response->assertRedirect(route('admin.celebrities.show', $celebrity));
    $celebrity->refresh();
    expect($celebrity->name)->toBe('Updated Name');
});

test('admin can delete a celebrity', function (): void {
    $celebrity = Celebrity::factory()->create();

    $response = $this->actingAs($this->admin)->delete(route('admin.celebrities.destroy', $celebrity));

    $response->assertRedirect(route('admin.celebrities.index'));
    $this->assertDatabaseMissing('celebrities', ['id' => $celebrity->id]);
});

test('admin can add a relationship between two celebrities', function (): void {
    $c1 = Celebrity::factory()->create();
    $c2 = Celebrity::factory()->create();

    $response = $this->actingAs($this->admin)->post(route('admin.celebrities.relationships.store'), [
        'celebrity_1_id' => $c1->id,
        'celebrity_2_id' => $c2->id,
        'redirect_celebrity_id' => $c1->id,
    ]);

    $response->assertRedirect(route('admin.celebrities.show', $c1->id));
    $this->assertDatabaseHas('celebrity_relationships', [
        'celebrity_1_id' => $c1->id,
        'celebrity_2_id' => $c2->id,
    ]);
});

test('admin can delete a relationship', function (): void {
    $rel = CelebrityRelationship::create([
        'celebrity_1_id' => Celebrity::factory()->create()->id,
        'celebrity_2_id' => Celebrity::factory()->create()->id,
    ]);

    $response = $this->actingAs($this->admin)->delete(
        route('admin.celebrities.relationships.destroy', $rel).'?redirect_celebrity_id='.$rel->celebrity_1_id
    );

    $response->assertRedirect(route('admin.celebrities.show', $rel->celebrity_1_id));
    $this->assertDatabaseMissing('celebrity_relationships', ['id' => $rel->id]);
});

test('guests cannot access celebrities index', function (): void {
    $this->get(route('admin.celebrities.index'))->assertRedirect(route('login'));
});

test('non-admin cannot access celebrities index', function (): void {
    $user = User::factory()->create(['role_id' => 2]);

    $this->actingAs($user)->get(route('admin.celebrities.index'))->assertRedirect(route('home'));
});

test('admin can queue celebrity image regeneration', function (): void {
    Queue::fake();
    $celebrity = Celebrity::factory()->create();

    $response = $this->actingAs($this->admin)->post(route('admin.celebrities.regenerate-image', $celebrity));

    $response->assertRedirect(route('admin.celebrities.show', $celebrity));
    $response->assertSessionHas('success');
    Queue::assertPushed(RegenerateCelebrityImage::class);
});

test('admin can search celebrities for relationship dropdown', function (): void {
    $a = Celebrity::factory()->create(['name' => 'Alice A']);
    $b = Celebrity::factory()->create(['name' => 'Bob B']);
    $c = Celebrity::factory()->create(['name' => 'Alice B']);

    $response = $this->actingAs($this->admin)->getJson(route('admin.celebrities.search', ['q' => 'Alice', 'exclude' => $a->id]));

    $response->assertOk();
    $data = $response->json();
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Alice B');
});
