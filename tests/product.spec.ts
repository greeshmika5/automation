import { test, expect } from '@playwright/test';

test.describe('Product Tests', () => {

  test('TC-005 Product Listing', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.waitForLoadState('networkidle');

    const products = page.locator('.card');
    await expect(products).toHaveCount(16, { timeout: 30000 }); // actual count on the page
  });

  test('TC-006 Product Details', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.card-title').filter({ hasText: 'Chocolate Cups' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=£1.00').first()).toBeVisible();
  });

  test('TC-007 Image Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    await expect(images.first()).toBeVisible();
  });

});