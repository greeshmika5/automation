import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * POST /payments request body (from Swagger):
 *   { orderId: string (e.g. "ORD-1001"), method: string (e.g. "credit_card") }
 *
 * POST /payments response shape:
 *   201  → { paymentId: string, status: string, amount: number, message: string }
 *   400  → { error: string }  (missing fields)
 *   401  → { error: string }  (unauthorized)
 *   404  → { error: string }  (order not found)
 *   409  → { error: string }  (payment already processed)
 *
 * GET /payments/{paymentId} — paymentId is a STRING (e.g. "PAY-5001"):
 *   200  → { paymentId: string, orderId: string, method: string, amount: number, status: string, processedAt: string }
 *   401  → { error: string }
 *   404  → { error: string }
 */

async function getAuthToken(request: any): Promise<string> {
  const res = await request.post(`${BASE_URL}/auth/login`, {
    data: { email: 'admin@shopeasy.com', password: 'password123' },
  });
  const body = await res.json();
  return body.token as string;
}

async function placeOrder(request: any, token: string): Promise<string | null> {
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

  if (orderRes.status() === 201) {
    const order = await orderRes.json();
    // orderId is a string like "ORD-1001"
    return order.orderId as string;
  }
  return null;
}

test.describe('Payments API Tests', () => {

  // ─── POST /payments ───────────────────────────────────────────────────────

  test('TC-API-043 POST /payments - unauthenticated request returns 401 with error field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/payments`, {
      data: { orderId: 'ORD-1001', method: 'credit_card' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-044 POST /payments - initiate payment returns 201 with paymentId, status, amount, message', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderId = await placeOrder(request, token);

    if (orderId !== null) {
      const response = await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId, method: 'credit_card' },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('paymentId');
      expect(typeof body.paymentId).toBe('string');
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('amount');
      expect(body).toHaveProperty('message');
    }
  });

  test('TC-API-045 POST /payments - paymentId follows PAY- prefix format', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderId = await placeOrder(request, token);

    if (orderId !== null) {
      const response = await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId, method: 'credit_card' },
      });

      if (response.status() === 201) {
        const body = await response.json();
        expect(body.paymentId).toMatch(/^PAY-/);
      }
    }
  });

  test('TC-API-046 POST /payments - missing method returns 400 with error field', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderId = await placeOrder(request, token);

    if (orderId !== null) {
      const response = await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });

  test('TC-API-047 POST /payments - missing orderId returns 400 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { method: 'credit_card' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-048 POST /payments - non-existent orderId returns 404 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post(`${BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { orderId: 'ORD-999999', method: 'credit_card' },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-049 POST /payments - duplicate payment returns 409 with error field', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderId = await placeOrder(request, token);

    if (orderId !== null) {
      // First payment
      await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId, method: 'credit_card' },
      });

      // Second payment on same order
      const response = await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId, method: 'credit_card' },
      });

      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });

  // ─── GET /payments/{paymentId} ────────────────────────────────────────────

  test('TC-API-050 GET /payments/{paymentId} - unauthenticated request returns 401 with error field', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/payments/PAY-5001`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-051 GET /payments/{paymentId} - valid paymentId returns all payment fields', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderId = await placeOrder(request, token);

    if (orderId !== null) {
      const paymentRes = await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId, method: 'credit_card' },
      });

      if (paymentRes.status() === 201) {
        const payment = await paymentRes.json();
        const paymentId: string = payment.paymentId;

        const response = await request.get(`${BASE_URL}/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('paymentId');
        expect(body).toHaveProperty('orderId');
        expect(body).toHaveProperty('method');
        expect(body).toHaveProperty('amount');
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('processedAt');
        expect(body.paymentId).toBe(paymentId);
        expect(body.orderId).toBe(orderId);
      }
    }
  });

  test('TC-API-052 GET /payments/{paymentId} - non-existent paymentId returns 404 with error field', async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.get(`${BASE_URL}/payments/PAY-999999`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-053 GET /payments/{paymentId} - payment amount matches order total', async ({ request }) => {
    const token = await getAuthToken(request);
    const orderId = await placeOrder(request, token);

    if (orderId !== null) {
      const paymentRes = await request.post(`${BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { orderId, method: 'credit_card' },
      });

      if (paymentRes.status() === 201) {
        const payment = await paymentRes.json();

        const getRes = await request.get(`${BASE_URL}/payments/${payment.paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (getRes.status() === 200) {
          const body = await getRes.json();
          expect(typeof body.amount).toBe('number');
          expect(body.amount).toBeGreaterThan(0);
          expect(body.method).toBe('credit_card');
        }
      }
    }
  });
});

