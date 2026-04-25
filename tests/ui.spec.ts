import { test, expect } from '@playwright/test';

test.describe('UI & Edge Tests', () => {

  test('TC-034 UI Text Visible', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: 'Browse sweets' })).toBeVisible({ timeout: 10000 });
  });

  test('TC-035 Layout Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Sweet Shop Project 2018')).toBeVisible();
  });

  test('TC-036 Responsive Testing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('https://sweetshop.netlify.app/sweets');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('TC-037 Rapid Clicking', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    const button = page.locator('text=Add to Basket').first();
    for (let i = 0; i < 10; i++) {
      await button.click();
    }
    await expect(page.locator('nav')).toBeVisible();
  });

  test('TC-038 Refresh After Add', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await page.locator('text=Add to Basket').first().click();
    await page.waitForFunction(() => {
      const basket = localStorage.getItem('basket');
      return basket && JSON.parse(basket).length > 0;
    });
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await expect(page.locator('h6.my-0').filter({ hasText: 'Chocolate Cups' })).toBeVisible({ timeout: 15000 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h6.my-0').filter({ hasText: 'Chocolate Cups' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-039 Long Input Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    // Input has maxlength="30" — system truncates to 30 chars
    await page.locator('#name').first().fill('A'.repeat(200));
    await expect(page.locator('#name').first()).toHaveValue('A'.repeat(30));
  });

  test('TC-040 Special Character Input', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.fill('input[type="email"]', '@@@###');
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Please enter a valid email address for shipping updates.')).toBeVisible();
  });

});

