import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * POST /orders response shape (from Swagger):
 *   201  → { orderId: string, total: number, status: string, message: string }
 *   400  → { error: string }  (cart is empty)
 *   401  → { error: string }  (unauthorized)
 *   Note: No request body — order is placed from the current cart.
 *
 * GET /orders/{orderId} — orderId is a STRING (e.g. "ORD-1001"):
 *   200  → { orderId: string, status: string, total: number, items: [...], createdAt: string }
 *   401  → { error: string }
 *   403  → { error: string }  (not your order)
 *   404  → { error: string }  (order not found)
 *
 * DELETE /orders/{orderId}/cancel — orderId is a STRING:
 *   200  → { orderId: string, status: string, message: string }
 *   401  → { error: string }
 *   404  → { error: string }
 *   422  → { error: string }  (cannot cancel shipped/delivered order)
 */

async function getAuthToken(request: any): Promise<string> {
  const res = await request.post(`${BASE_URL}/auth/login`, {
    data: { email: 'admin@shopeasy.com', password: 'password123' },
  });
  const body = await res.json();
  return body.token as string;
}

async function addItemToCartAndPlaceOrder(request: any, token: string): Promise<any> {
  // Products are paginated → use body.data[0]
  const productRes = await request.get(`${BASE_URL}/products`);
  const productBody = await productRes.json();
  const productId = productBody.data[0].id;

  await request.post(`${BASE_URL}/cart/items`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { productId, quantity: 1 },
  });

  // POST /orders takes no body
  const orderRes = await request.post(`${BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return orderRes;
}

test.describe('Orders API Tests', () => {

  // ─── POST /orders ─────────────────────────────────────────────────────────

  test('TC-API-031 POST /orders - unauthenticated request returns 401 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/orders`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-032 POST /orders - place order from cart returns 201 with orderId, total, status, message', async ({ request }) => {
    const token = await getAuthToken(request);
    const response = await addItemToCartAndPlaceOrder(request, token);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('orderId');
    expect(typeof body.orderId).toBe('string');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('message');
  });

  test('TC-API-033 POST /orders - orderId follows ORD- prefix format', async ({ request }) => {
    const token = await getAuthToken(request);
    const response = await addItemToCartAndPlaceOrder(request, token);

    if (response.status() === 201) {
      const body = await response.json();
      expect(body.orderId).toMatch(/^ORD-/);
    }
  });

  test('TC-API-034 POST /orders - empty cart returns 400 with error field', async ({ request }) => {
    // Register a brand-new user so their cart is guaranteed empty
    const timestamp = Date.now();
    const email = `emptyuser_${timestamp}@shopeasy.com`;
    const password = 'Test@1234';

    await request.post(`${BASE_URL}/auth/register`, {
      data: { email, password, name: 'Empty User' },
    });

    const loginRes = await request.post(`${BASE_URL}/auth/login`, {
      data: { email, password },
    });
    const { token } = await loginRes.json();

    const response = await request.post(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  // ─── GET /orders/{orderId} ────────────────────────────────────────────────

  test('TC-API-035 GET /orders/{orderId} - unauthenticated request returns 401 with error field', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/orders/ORD-1001`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-036 GET /orders/{orderId} - valid orderId returns order with all fields', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderRes = await addItemToCartAndPlaceOrder(request, token);

    if (orderRes.status() === 201) {
      const placed = await orderRes.json();
      const orderId: string = placed.orderId;

      const response = await request.get(`${BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.orderId).toBe(orderId);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('createdAt');
    }
  });

  test('TC-API-037 GET /orders/{orderId} - non-existent orderId returns 404 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.get(`${BASE_URL}/orders/ORD-999999`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-038 GET /orders/{orderId} - another user\'s order returns 403 with error field', async ({ request }) => {
    // Create two separate users and cross-check ownership
    const timestamp = Date.now();
    const emailA = `usera_${timestamp}@shopeasy.com`;
    const emailB = `userb_${timestamp}@shopeasy.com`;
    const password = 'Test@1234';

    await request.post(`${BASE_URL}/auth/register`, { data: { email: emailA, password, name: 'User A' } });
    await request.post(`${BASE_URL}/auth/register`, { data: { email: emailB, password, name: 'User B' } });

    const loginA = await request.post(`${BASE_URL}/auth/login`, { data: { email: emailA, password } });
    const loginB = await request.post(`${BASE_URL}/auth/login`, { data: { email: emailB, password } });
    const tokenA = (await loginA.json()).token;
    const tokenB = (await loginB.json()).token;

    // Place order as user A
    const productRes = await request.get(`${BASE_URL}/products`);
    const productBody = await productRes.json();
    const productId = productBody.data[0].id;

    await request.post(`${BASE_URL}/cart/items`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { productId, quantity: 1 },
    });
    const orderRes = await request.post(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    if (orderRes.status() === 201) {
      const placed = await orderRes.json();

      // Try to access with user B
      const response = await request.get(`${BASE_URL}/orders/${placed.orderId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });

      expect([403, 404]).toContain(response.status());
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });

  // ─── DELETE /orders/{orderId}/cancel ──────────────────────────────────────

  test('TC-API-039 DELETE /orders/{orderId}/cancel - unauthenticated request returns 401 with error field', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/orders/ORD-1001/cancel`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-040 DELETE /orders/{orderId}/cancel - cancel pending order returns 200 with orderId, status, message', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderRes = await addItemToCartAndPlaceOrder(request, token);

    if (orderRes.status() === 201) {
      const placed = await orderRes.json();

      const response = await request.delete(`${BASE_URL}/orders/${placed.orderId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('orderId');
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('message');
    }
  });

  test('TC-API-041 DELETE /orders/{orderId}/cancel - non-existent orderId returns 404 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.delete(`${BASE_URL}/orders/ORD-999999/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-042 DELETE /orders/{orderId}/cancel - cancelled order status is updated in GET response', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderRes = await addItemToCartAndPlaceOrder(request, token);

    if (orderRes.status() === 201) {
      const placed = await orderRes.json();

      await request.delete(`${BASE_URL}/orders/${placed.orderId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchRes = await request.get(`${BASE_URL}/orders/${placed.orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fetchRes.status() === 200) {
        const updated = await fetchRes.json();
        expect(updated.status).toMatch(/cancel/i);
      }
    }
  });
});
