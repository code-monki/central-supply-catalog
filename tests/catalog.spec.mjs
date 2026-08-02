import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { searchIndexVersion } from '../astro/lib/catalog.mjs';

const sampledRoutes = [
  '/',
  '/about-the-central-supply-catalog/',
  '/disclaimers/',
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
const expectedBasePath = process.env.SITE_BASE_PATH ? `${process.env.SITE_BASE_PATH.replace(/\/+$/, '')}/` : '/';
const escapedBasePath = expectedBasePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routePath = (route) => `${expectedBasePath.replace(/\/$/, '')}${route}`;

test.describe('route smoke tests', () => {
  for (const route of sampledRoutes) {
    test(`${route} renders without browser errors`, async ({ page }) => {
      const failedRequests = [];
      const consoleErrors = [];

      page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      const response = await page.goto(routePath(route));
      expect(response?.ok()).toBe(true);
      await expect(page).toHaveTitle(/Central Supply Catalog/);
      await expect(page.locator('main')).toHaveCount(1);
      expect(failedRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});

test('about and disclaimers pages keep distinct content', async ({ page }) => {
  await page.goto(routePath('/about-the-central-supply-catalog/'));
  await expect(page.getByRole('heading', { name: 'About the Central Supply Catalog' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Credits' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Disclaimers' })).toHaveCount(0);
  await expect(page.getByText('The Central Supply Catalog separates software licensing')).toHaveCount(0);

  await page.goto(routePath('/disclaimers/'));
  await expect(page.getByRole('heading', { name: 'Disclaimers' })).toBeVisible();
  await expect(page.getByText('The Central Supply Catalog separates software licensing')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About the Central Supply Catalog' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Credits' })).toHaveCount(0);
});

test('search warms and reuses a versioned localStorage cache', async ({ page }) => {
  await page.goto(routePath('/support/search/?s=laser'));

  await expect(page.getByRole('heading', { name: /Search found 41 results for:/ })).toBeVisible();
  await expect(page.locator('.search-result-row')).toHaveCount(41);
  const thumbnailPathnames = await page.locator('.thumbnail-img').evaluateAll((images) =>
    images.map((image) => new URL(image.src).pathname)
  );
  expect(thumbnailPathnames.every((pathname) => pathname.startsWith(expectedBasePath))).toBe(true);
  expect(thumbnailPathnames[0]).toMatch(new RegExp(`${escapedBasePath}_astro/`));
  expect(thumbnailPathnames.some((pathname) => pathname.startsWith(`${expectedBasePath}img/products/`))).toBe(true);

  const cacheKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('csc-search-index:')));
  expect(cacheKeys).toEqual([`csc-search-index:${searchIndexVersion()}`]);

  let searchIndexRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/_data/searchindex.json')) searchIndexRequests += 1;
  });

  await page.reload();
  await expect(page.getByRole('heading', { name: /Search found 41 results for:/ })).toBeVisible();
  expect(searchIndexRequests).toBe(0);
});

test('catalog search matches terms, phrases, and boolean groups', async ({ page }) => {
  await page.goto(routePath('/support/search/?s=laser+pistol'));

  await expect(page.getByRole('heading', { name: /Search found 17 results for:/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Laser Pistol, Early/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Laser Rifle/ })).toHaveCount(0);

  await page.goto(routePath('/support/search/?s=%22laser+pistol%22'));
  await expect(page.getByRole('heading', { name: /Search found 17 results for:/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Laser Pistol, Early/ })).toBeVisible();

  await page.goto(routePath('/support/search/?s=laser+NOT+rifle'));
  await expect(page.getByRole('heading', { name: /Search found 32 results for:/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Laser Rifle/ })).toHaveCount(0);

  await page.goto(routePath('/support/search/?s=(laser+OR+maser)+AND+pistol'));
  await expect(page.getByRole('heading', { name: /Search found 17 results for:/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Laser Pistol, Early/ })).toBeVisible();
});

test('search results page does not render help article content', async ({ page }) => {
  await page.goto(routePath('/support/search/?s=Vacc+Suit'));

  await expect(page.getByRole('heading', { name: /Search found 5 results for:/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Searching the Central Supply Catalog' })).toHaveCount(0);
  await expect(page.getByText('The search feature allows the user to enter one or more keywords')).toHaveCount(0);
});

test('product purchase persists to the shopping cart and quantity controls update totals', async ({ page }) => {
  await page.goto(routePath('/products/200-011-00001/'));

  const quantityInput = page.getByLabel('Qty:');
  await quantityInput.fill('2');
  await expect(quantityInput).toHaveValue('2');
  await page.getByRole('button', { name: 'Add To Cart' }).click();
  await expect(page.getByRole('status')).toHaveText('Item added to cart');
  await expect(page.locator('#cart-badge')).toHaveText('1');

  await page.goto(routePath('/shopping-cart/'));
  await expect(page.getByRole('link', { name: sampledProduct.name }).first()).toBeVisible();
  const cartImagePathname = await page.locator('.shopping-cart .responsive-img').first().evaluate((image) => new URL(image.src).pathname);
  expect(cartImagePathname).toBe(`${expectedBasePath}img/products/${sampledProduct.sku}.png`);
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
  await page.goto(routePath('/'));

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
  await expect(page).toHaveURL(new RegExp(`${escapedBasePath}support/search/\\?s=laser$`));
});

test.describe('accessibility regression checks', () => {
  for (const route of ['/', '/products/200-011-00001/', '/departments/weapons/', '/support/search/?s=laser', '/shopping-cart/']) {
    test(`${route} has no automated axe violations`, async ({ page }) => {
      await page.goto(routePath(route));
      if (route.includes('/support/search/')) {
        await expect(page.getByRole('heading', { name: /Search found/ })).toBeVisible();
      }

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
