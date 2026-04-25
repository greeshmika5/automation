import { test, expect } from '@playwright/test';

// Helper: add items to basket and wait for localStorage to confirm the write
async function addToBasket(page: any, nth: number, expectedCount: number) {
  await page.locator('text=Add to Basket').nth(nth).click();
  await page.waitForFunction(
    (count: number) => {
      const basket = localStorage.getItem('basket');
      if (!basket) return false;
      try { return JSON.parse(basket).length >= count; } catch { return false; }
    },
    expectedCount
  );
}

test.describe('Basket Tests', () => {

  test('TC-008 Add to Basket', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1);
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await expect(page.locator('h1').filter({ hasText: 'Your Basket' })).toBeVisible();
  });

  test('TC-009 Add Multiple Products', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1); // Chocolate Cups
    await addToBasket(page, 1, 2); // Sherbert Straws
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await expect(page.locator('h6.my-0').filter({ hasText: 'Chocolate Cups' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h6.my-0').filter({ hasText: 'Sherbert Straws' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-010 Add Same Product Multiple Times', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1);
    await addToBasket(page, 0, 2);
    await addToBasket(page, 0, 3);
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await expect(page.locator('p').filter({ hasText: 'x 3' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-011 Verify Basket Items', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1);
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await expect(page.locator('h6.my-0').filter({ hasText: 'Chocolate Cups' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-012 Verify Total Calculation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1); // Chocolate Cups £1.00
    await addToBasket(page, 1, 2); // Sherbert Straws £0.75
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await expect(page.locator('span').filter({ hasText: '£1.00' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('span').filter({ hasText: '£0.75' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-013 Remove Item', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1);
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    const deleteLinks = page.locator('a', { hasText: 'Delete Item' });
    await deleteLinks.first().waitFor({ state: 'visible', timeout: 15000 });
    const countBefore = await deleteLinks.count();
    await deleteLinks.first().click();
    await expect(deleteLinks).toHaveCount(countBefore - 1, { timeout: 10000 });
  });

  test('TC-014 Empty Basket', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/sweets');
    await addToBasket(page, 0, 1);
    await page.locator('a[href="/basket"]').click();
    await page.waitForURL(/basket/);
    await page.locator('a', { hasText: 'Delete Item' }).first().waitFor({ state: 'visible', timeout: 15000 });
    await page.click('text=Empty Basket');
    await page.waitForFunction(() => {
      const basket = localStorage.getItem('basket');
      return !basket || JSON.parse(basket).length === 0;
    }, { timeout: 10000 });
    await expect(page.locator('a', { hasText: 'Delete Item' }).first()).not.toBeVisible({ timeout: 10000 });
  });

});

