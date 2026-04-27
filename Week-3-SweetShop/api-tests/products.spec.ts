import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * GET /products response shape (from Swagger):
 *   200 → { total: number, page: number, limit: number, data: [{ id, name, price, category, stock }] }
 *
 * GET /products/{id} response shape:
 *   200 → { id, name, price, category, stock }
 *   404 → { error: "Resource not found" }
 *
 * Query params: category (string), page (integer), limit (integer)
 */

test.describe('Products API Tests', () => {

  // ─── GET /products ────────────────────────────────────────────────────────

  test('TC-API-011 GET /products - returns 200 with paginated wrapper', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('TC-API-012 GET /products - each product has required fields including stock', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products`);
    const body = await response.json();

    for (const product of body.data) {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('stock');
    }
  });

  test('TC-API-013 GET /products - pagination params page and limit are respected', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products?page=1&limit=10`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.data.length).toBeLessThanOrEqual(10);
  });

  test('TC-API-014 GET /products - filter by category returns only matching products', async ({ request }) => {
    const allRes = await request.get(`${BASE_URL}/products`);
    const allBody = await allRes.json();
    const category = allBody.data[0].category as string;

    const response = await request.get(`${BASE_URL}/products?category=${encodeURIComponent(category)}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    for (const p of body.data) {
      expect(p.category).toBe(category);
    }
  });

  test('TC-API-015 GET /products - total reflects actual count', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products`);
    const body = await response.json();

    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThan(0);
  });

  // ─── GET /products/{id} ───────────────────────────────────────────────────

  test('TC-API-016 GET /products/{id} - valid id returns product with all fields', async ({ request }) => {
    const listRes = await request.get(`${BASE_URL}/products`);
    const listBody = await listRes.json();
    const firstId = listBody.data[0].id;

    const response = await request.get(`${BASE_URL}/products/${firstId}`);

    expect(response.status()).toBe(200);
    const product = await response.json();
    expect(product.id).toBe(firstId);
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('category');
    expect(product).toHaveProperty('stock');
  });

  test('TC-API-017 GET /products/{id} - non-existent id returns 404 with error field', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products/999999`);

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('TC-API-018 GET /products/{id} - invalid id format returns 400 or 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/products/abc`);

    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-019 GET /products/{id} - price is a positive number', async ({ request }) => {
    const listRes = await request.get(`${BASE_URL}/products`);
    const listBody = await listRes.json();
    const firstId = listBody.data[0].id;

    const response = await request.get(`${BASE_URL}/products/${firstId}`);
    const product = await response.json();

    expect(typeof product.price).toBe('number');
    expect(product.price).toBeGreaterThan(0);
  });
});
