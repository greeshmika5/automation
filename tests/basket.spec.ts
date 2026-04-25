import { test, expect } from '@playwright/test';

// localStorage format: key = product data-id (e.g. "1"), value = '{"id":"1","name":"Chocolate Cups","price":"1.00","quantity":1}'
// Helper: click nth Add-to-Basket button and wait until that item's quantity reaches expectedQty in localStorage
async function addToBasket(page: any, nth: number, expectedQty: number = 1) {
  const dataId = await page.locator('.addItem').nth(nth).getAttribute('data-id');
  await page.locator('.addItem').nth(nth).click();
  await page.waitForFunction(
    ([id, qty]: [string, number]) => {
      const raw = localStorage.getItem(id);
      if (!raw) return false;
      try { return JSON.parse(raw).quantity >= qty; } catch { return false; }
    },
    [dataId, expectedQty] as [string, number]
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
    await addToBasket(page, 0, 1); // Chocolate Cups (id=1)
    await addToBasket(page, 1, 1); // Sherbert Straws (id=2)
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
    await addToBasket(page, 1, 1); // Sherbert Straws £0.75
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
    await page.waitForFunction(() => localStorage.length === 0, { timeout: 10000 });
    await expect(page.locator('a', { hasText: 'Delete Item' }).first()).not.toBeVisible({ timeout: 10000 });
  });


});


