import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Login response shape (from Swagger):
 *   200 → { token: string, userId: string, message: "Login successful" }
 *   400 → { error: string }   (missing required fields)
 *   401 → { error: string }   (invalid credentials)
 *
 * Register response shape (from Swagger):
 *   201 → { userId: string, message: "User registered successfully" }  ← NO token
 *   400 → { error: string }   (missing required fields)
 *   409 → { error: string }   (email already exists)
 */

test.describe('Auth API Tests', () => {

  // ─── Login ────────────────────────────────────────────────────────────────

  test('TC-API-001 POST /auth/login - valid credentials returns 200 with token, userId and message', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: 'admin@shopeasy.com', password: 'password123' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // token
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);

    // userId
    expect(body).toHaveProperty('userId');

    // message
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/login successful/i);
  });

  test('TC-API-002 POST /auth/login - response token starts with "tok_"', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: 'admin@shopeasy.com', password: 'password123' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toMatch(/^tok_/);
  });

  test('TC-API-003 POST /auth/login - invalid password returns 401 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: 'admin@shopeasy.com', password: 'wrongpassword' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-004 POST /auth/login - unknown email returns 401 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: 'nobody@shopeasy.com', password: 'password123' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-005 POST /auth/login - missing email returns 400 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: { password: 'password123' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-006 POST /auth/login - missing password returns 400 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: 'admin@shopeasy.com' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-007 POST /auth/login - empty body returns 400 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  // ─── Register ─────────────────────────────────────────────────────────────

  test('TC-API-008 POST /auth/register - new user registration returns 201 with userId and message', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `testuser_${timestamp}@shopeasy.com`,
        password: 'Test@1234',
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    // Register does NOT return a token — use /auth/login after registration
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('userId');
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/user registered successfully/i);
  });

  test('TC-API-009 POST /auth/register - registered user can login immediately', async ({ request }) => {
    const timestamp = Date.now();
    const email = `newuser_${timestamp}@shopeasy.com`;
    const password = 'Test@1234';

    await request.post(`${BASE_URL}/auth/register`, {
      data: { email, password, name: 'New User' },
    });

    const loginRes = await request.post(`${BASE_URL}/auth/login`, {
      data: { email, password },
    });

    expect(loginRes.status()).toBe(200);
    const body = await loginRes.json();
    expect(body).toHaveProperty('token');
  });

  test('TC-API-010 POST /auth/register - duplicate email returns 409 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: 'admin@shopeasy.com',
        password: 'password123',
        name: 'Admin',
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-011 POST /auth/register - missing required fields returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/register`, {
      data: { email: 'incomplete@shopeasy.com' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  // BUG: API does not validate email format — 'not-an-email' is accepted and registered (201).
  // Expected: 400. Actual: 201 (first run) or 409 (duplicate on re-runs with a static email).
  test('TC-API-012 POST /auth/register - invalid email format is accepted by API (documents bug)', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/auth/register`, {
      data: { email: `not-an-email-${timestamp}`, password: 'Test@1234', name: 'Test' },
    });

    // API should return 400 for malformed email — server-side format validation is missing.
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('userId');
  });
});
