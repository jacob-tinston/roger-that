<?php

test('registration screen is not accessible', function () {
    $response = $this->get(route('register'));

    $response->assertNotFound();
});

test('registration endpoint is disabled', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertNotFound();
});