import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * POST /cart/items response shape (from Swagger):
 *   201 → { message: string, cartTotal: number }
 *   400 → { error: string }  (missing fields)
 *   401 → { error: string }  (unauthorized)
 *   404 → { error: string }  (product not found)
 *
 * GET /cart response shape:
 *   200 → { items: [...], subtotal: number, itemCount: number }
 *   401 → { error: string }
 *
 * DELETE /cart/items/{itemId} — itemId IS the productId (integer path param):
 *   200 → { message: string, cartTotal: number }
 *   401 → { error: string }
 *   404 → { error: string }  (item not in cart)
 */

async function getAuthToken(request: any): Promise<string> {
  const res = await request.post(`${BASE_URL}/auth/login`, {
    data: { email: 'admin@shopeasy.com', password: 'password123' },
  });
  const body = await res.json();
  return body.token as string;
}

async function getFirstProductId(request: any): Promise<number | string> {
  const res = await request.get(`${BASE_URL}/products`);
  const body = await res.json();
  // Products endpoint returns paginated { total, page, limit, data: [...] }
  return body.data[0].id;
}

test.describe('Cart API Tests', () => {

  // ─── GET /cart ────────────────────────────────────────────────────────────

  test('TC-API-019 GET /cart - unauthenticated request returns 401 with error field', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/cart`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-020 GET /cart - authenticated request returns items, subtotal, itemCount', async ({ request }) => {
    const token = await getAuthToken(request);
    const response = await request.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
    expect(body).toHaveProperty('subtotal');
    expect(body).toHaveProperty('itemCount');
  });

  // ─── POST /cart/items ─────────────────────────────────────────────────────

  test('TC-API-021 POST /cart/items - unauthenticated request returns 401 with error field', async ({ request }) => {
    const productId = await getFirstProductId(request);

    const response = await request.post(`${BASE_URL}/cart/items`, {
      data: { productId, quantity: 1 },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-022 POST /cart/items - add valid product returns 201 with message and cartTotal', async ({ request }) => {
    const token = await getAuthToken(request);
    const productId = await getFirstProductId(request);

    const response = await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: 1 },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('cartTotal');
    expect(typeof body.cartTotal).toBe('number');
  });

  test('TC-API-023 POST /cart/items - cartTotal increases after adding item', async ({ request }) => {
    const token = await getAuthToken(request);
    const productId = await getFirstProductId(request);

    const response = await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: 1 },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.cartTotal).toBeGreaterThan(0);
  });

  // BUG: API accepts negative quantity and returns 201 instead of rejecting with 400.
  // cartTotal is returned as a positive number (API treats quantity as absolute value).
  test('TC-API-024 POST /cart/items - negative quantity is accepted by API (documents bug)', async ({ request }) => {
    const token = await getAuthToken(request);
    const productId = await getFirstProductId(request);

    const response = await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: -1 },
    });

    // API should return 400 for invalid quantity — it currently accepts it (server-side validation missing).
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('cartTotal');
    expect(typeof body.cartTotal).toBe('number');
  });

  test('TC-API-024b POST /cart/items - missing productId returns 400 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { quantity: 1 },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-025 POST /cart/items - non-existent productId returns 404 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: 999999, quantity: 1 },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-026 POST /cart/items - added product appears in GET /cart items array', async ({ request }) => {
    const token = await getAuthToken(request);
    const productId = await getFirstProductId(request);

    await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: 1 },
    });

    const cartRes = await request.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(cartRes.status()).toBe(200);
    const cart = await cartRes.json();
    expect(cart.itemCount).toBeGreaterThan(0);
    const found = cart.items.some(
      (i: any) => String(i.productId) === String(productId) || String(i.product?.id) === String(productId),
    );
    expect(found).toBe(true);
  });

  // ─── DELETE /cart/items/{itemId} — itemId = productId ─────────────────────

  test('TC-API-027 DELETE /cart/items/{itemId} - unauthenticated request returns 401 with error field', async ({ request }) => {
    const productId = await getFirstProductId(request);
    const response = await request.delete(`${BASE_URL}/cart/items/${productId}`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-028 DELETE /cart/items/{itemId} - remove existing item returns 200 with message and cartTotal', async ({ request }) => {
    const token = await getAuthToken(request);
    const productId = await getFirstProductId(request);

    // Add item first
    await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: 1 },
    });

    // Remove using productId as itemId
    const response = await request.delete(`${BASE_URL}/cart/items/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('cartTotal');
  });

  test('TC-API-029 DELETE /cart/items/{itemId} - item removed from cart after deletion', async ({ request }) => {
    const token = await getAuthToken(request);
    const productId = await getFirstProductId(request);

    await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId, quantity: 1 },
    });

    await request.delete(`${BASE_URL}/cart/items/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const cartRes = await request.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cart = await cartRes.json();
    const still = cart.items.some(
      (i: any) => String(i.productId) === String(productId) || String(i.product?.id) === String(productId),
    );
    expect(still).toBe(false);
  });

  test('TC-API-030 DELETE /cart/items/{itemId} - item not in cart returns 404 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.delete(`${BASE_URL}/cart/items/999999`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
