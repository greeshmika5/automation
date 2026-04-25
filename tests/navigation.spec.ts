import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {

  test('TC-001 Navigate to Sweets page', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/about');
    await page.click('a[href="/sweets"]');
    await expect(page).toHaveURL(/sweets/);
    await expect(page.locator('h1').filter({ hasText: 'Browse sweets' })).toBeVisible({ timeout: 10000 });
  });

  test('TC-002 Navigate to About page', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/about/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('TC-003 Navigate to Login page', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h1').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('TC-004 Navigate to Basket page', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.click('a[href="/basket"]');
    await expect(page).toHaveURL(/basket/);
    await expect(page.locator('h1').filter({ hasText: 'Your Basket' })).toBeVisible();
  });

  test('TC-033 Verify About Page Content', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/about');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText('Sweet Shop');
  });

});
