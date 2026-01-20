<?php

use App\Models\Role;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('admin users can visit the dashboard', function () {
    Role::create(['name' => 'Admin']);
    Role::create(['name' => 'User']);

    $admin = User::factory()->create(['role_id' => 1]);

    $this->actingAs($admin)->get(route('dashboard'))->assertOk();
});

test('non-admin authenticated users are redirected to home when visiting dashboard', function () {
    Role::create(['name' => 'Admin']);
    Role::create(['name' => 'User']);

    $user = User::factory()->create(['role_id' => 2]);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('home'));
});