import { test, expect } from '@playwright/test';

const URL = 'https://www.saucedemo.com/';

// 🔑 1. Valid Login
test('Valid Login', async ({ page }) => {
 await page.goto(URL);
 await page.fill('#user-name', 'standard_user');
 await page.fill('#password', 'secret_sauce');
 await page.click('#login-button');
 await expect(page).toHaveURL(/inventory/);
});

// ❌ 2. Invalid Login
test('Invalid Login', async ({ page }) => {
 await page.goto(URL);
 await page.fill('#user-name', 'wrong_user');
 await page.fill('#password', 'wrong_pass');
 await page.click('#login-button');
 await expect(page.locator('[data-test="error"]')).toBeVisible();
});

// 🛒 3. Add to Cart
test('Add Product to Cart', async ({ page }) => {
 await page.goto(URL);
 await page.fill('#user-name', 'standard_user');
 await page.fill('#password', 'secret_sauce');
 await page.click('#login-button');
 await page.click('.inventory_item button');
 await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
});

// 🗑 4. Remove from Cart
test('Remove Product from Cart', async ({ page }) => {
 await page.goto(URL);
 await page.fill('#user-name', 'standard_user');
 await page.fill('#password', 'secret_sauce');
 await page.click('#login-button');
 await page.click('.inventory_item button');
 await page.click('.inventory_item button'); // remove
 await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
});

// 💳 5. Complete Checkout
test('Complete Checkout Flow', async ({ page }) => {
 await page.goto(URL);
 await page.fill('#user-name', 'standard_user');
 await page.fill('#password', 'secret_sauce');
 await page.click('#login-button');

 await page.click('.inventory_item button');
 await page.click('.shopping_cart_link');

 await page.click('#checkout');
 await page.fill('#first-name', 'Greesh');
 await page.fill('#last-name', 'Test');
 await page.fill('#postal-code', '503002');

 await page.click('#continue');
 await page.click('#finish');

 await expect(page.locator('.complete-header'))
   .toHaveText('Thank you for your order!');
});

// 🔄 6. Logout
test('Logout Flow', async ({ page }) => {
 await page.goto(URL);
 await page.fill('#user-name', 'standard_user');
 await page.fill('#password', 'secret_sauce');
 await page.click('#login-button');

 await page.click('#react-burger-menu-btn');
 await page.click('#logout_sidebar_link');

 await expect(page).toHaveURL(URL);
});
