import { test, expect } from '@playwright/test';

test.describe('Checkout Tests', () => {

  test('TC-015 First Name Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Valid first name is required.')).toBeVisible();
  });

  test('TC-016 Last Name Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Valid last name is required.')).toBeVisible();
  });

  test('TC-017 Email Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.fill('input[type="email"]', 'abc@.com');
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Please enter a valid email address for shipping updates.')).toBeVisible();
  });

  test('TC-018 Address Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Please enter your shipping address.')).toBeVisible();
  });

  test('TC-019 Country Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Please select a valid country.')).toBeVisible();
  });

  test('TC-020 City Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Please provide a valid state.')).toBeVisible();
  });

  test('TC-021 Zip Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Zip code required.')).toBeVisible();
  });

  test('TC-022 Card Name Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Name on card is required')).toBeVisible();
  });

  test('TC-023 Card Number Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Credit card number is required')).toBeVisible();
  });

  test('TC-024 Expiry Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Expiration date required')).toBeVisible();
  });

  test('TC-025 CVV Validation', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.click('text=Continue to checkout');
    await expect(page.locator('text=Security code required')).toBeVisible();
  });

  test('TC-026 Valid Checkout Flow', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.locator('form.needs-validation').waitFor({ timeout: 10000 });
    await page.locator('#name').first().fill('Sai');
    await page.locator('#name').nth(1).fill('Kumar');
    await page.locator('#email').fill('sai@test.com');
    await page.locator('#address').fill('1234 Main St');
    await page.locator('select').first().selectOption({ label: 'United Kingdom' });
    await page.locator('select').nth(1).selectOption({ label: 'Bristol' });
    await page.locator('#zip').fill('BS1 1AA');
    await page.locator('#cc-name').fill('Sai Kumar');
    await page.locator('#cc-number').fill('4111111111111111');
    await page.locator('#cc-expiration').fill('12/26');
    await page.locator('#cc-cvv').fill('123');
    await page.click('text=Continue to checkout');
    await expect(page).toHaveURL(/basket/);
  });

  test('TC-027 Select Delivery Option', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    // Click the label (not the hidden radio input) — label intercepts pointer events
    await page.locator('label[for="exampleRadios2"]').click();
    await expect(page.locator('#exampleRadios2')).toBeChecked();
  });

  test('TC-028 Apply Promo Code', async ({ page }) => {
    await page.goto('https://sweetshop.netlify.app/basket');
    await page.fill('input[placeholder="Promo code"]', 'DISCOUNT10');
    await page.click('text=Redeem');
    await expect(page).toHaveURL(/basket/);
  });

});
