import { test, expect } from '@playwright/test';

test.describe('Login Tests', () => {

  test('TC-029 Login Page Load', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/login');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h1').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('TC-030 Login Empty Fields', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/login');
    await page.click('text=Login');
    await expect(page).toHaveURL(/login/);
  });

  test('TC-031 Login Invalid Credentials', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'wrong123');
    await page.click('text=Login');
    await expect(page).toHaveURL(/login/);
  });

  test('TC-032 Login Valid Credentials', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/login');
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'Test@123');
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav')).toBeVisible();
  });

});
