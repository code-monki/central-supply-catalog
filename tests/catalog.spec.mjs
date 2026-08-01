import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const sampledRoutes = [
  '/',
  '/about-the-central-supply-catalog/',
  '/support/',
  '/support/search/?s=laser',
  '/shopping-cart/',
  '/departments/weapons/',
  '/departments/weapons/2/',
  '/products/200-011-00001/',
];

const sampledProduct = {
  sku: '200-011-00001',
  name: 'Gunsight, Electronic',
};

test.describe('route smoke tests', () => {
  for (const route of sampledRoutes) {
    test(`${route} renders without browser errors`, async ({ page }) => {
      const failedRequests = [];
      const consoleErrors = [];

      page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      const response = await page.goto(route);
      expect(response?.ok()).toBe(true);
      await expect(page).toHaveTitle(/Central Supply Catalog/);
      await expect(page.locator('main')).toHaveCount(1);
      expect(failedRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});

test('search warms and reuses a versioned localStorage cache', async ({ page }) => {
  await page.goto('/support/search/?s=laser');

  await expect(page.getByRole('heading', { name: /Search found 41 results for:/ })).toBeVisible();
  await expect(page.locator('.search-result-row')).toHaveCount(41);

  const cacheKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('csc-search-index:')));
  expect(cacheKeys).toEqual(['csc-search-index:13']);

  let searchIndexRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/_data/searchindex.json')) searchIndexRequests += 1;
  });

  await page.reload();
  await expect(page.getByRole('heading', { name: /Search found 41 results for:/ })).toBeVisible();
  expect(searchIndexRequests).toBe(0);
});

test('product purchase persists to the shopping cart and quantity controls update totals', async ({ page }) => {
  await page.goto('/products/200-011-00001/');

  await page.getByLabel('Qty:').fill('2');
  await page.getByRole('button', { name: 'Add To Cart' }).click();
  await expect(page.getByRole('status')).toHaveText('Item added to cart');
  await expect(page.locator('#cart-badge')).toHaveText('1');

  await page.goto('/shopping-cart/');
  await expect(page.getByRole('link', { name: sampledProduct.name }).first()).toBeVisible();
  await expect(page.getByLabel(`Quantity for ${sampledProduct.name}`)).toHaveValue('2');
  await expect(page.locator('#cart-total')).toContainText('Total:');

  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.getByLabel(`Quantity for ${sampledProduct.name}`)).toHaveValue('3');

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('csc-cart') || '[]'));
  expect(cart).toMatchObject([{ sku: sampledProduct.sku, qty: 3 }]);

  await page.getByRole('button', { name: 'Remove item' }).click();
  await expect(page.getByText('Cart is empty')).toBeVisible();
});

test('keyboard navigation reaches menu, department, search, and cart controls', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open navigation' }).focus();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

  await page.getByRole('button', { name: 'Close navigation' }).focus();
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
  await page.keyboard.press('Enter');

  await page.getByRole('link', { name: 'Central Supply Catalog' }).focus();
  await expect(page.getByRole('link', { name: 'Central Supply Catalog' })).toBeFocused();
  await page.locator('#shopping-cart a').focus();
  await expect(page.locator('#shopping-cart a')).toBeFocused();
  await page.getByRole('button', { name: 'Departments' }).focus();
  await expect(page.getByRole('button', { name: 'Departments' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dept-dropdown')).toBeVisible();

  await page.locator('#dept-dropdown a').first().focus();
  await expect(page.locator('#dept-dropdown a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await page.locator('#search-input').focus();
  await page.keyboard.type('laser');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/support\/search\/\?s=laser$/);
});

test.describe('accessibility regression checks', () => {
  for (const route of ['/', '/products/200-011-00001/', '/departments/weapons/', '/support/search/?s=laser', '/shopping-cart/']) {
    test(`${route} has no automated axe violations`, async ({ page }) => {
      await page.goto(route);
      if (route.includes('/support/search/')) {
        await expect(page.getByRole('heading', { name: /Search found/ })).toBeVisible();
      }

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
