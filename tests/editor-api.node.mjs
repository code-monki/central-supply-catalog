import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, test } from 'node:test';
import { createCatalogEditorServer } from '../scripts/catalog-editor.mjs';

const productFile = 'src/_data/products/weapon-accessories/200-011-00001.json';
const manifestFile = 'astro/data/catalog-manifest.json';
const originalProduct = fs.readFileSync(productFile, 'utf8');
const originalManifest = fs.readFileSync(manifestFile, 'utf8');
const originalManifestVersion = JSON.parse(originalManifest).catalogVersion;
let baseUrl;
let server;

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  return { response, body };
};

before(async () => {
  server = createCatalogEditorServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  fs.writeFileSync(productFile, originalProduct);
  fs.writeFileSync(manifestFile, originalManifest);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('editor serves catalog data and rendered product details', async () => {
  const catalog = await requestJson('/api/catalog');
  assert.equal(catalog.response.status, 200);
  assert.equal(catalog.body.manifest.catalogVersion, originalManifestVersion);
  assert.equal(catalog.body.departments.length, 43);
  assert.ok(catalog.body.products.some((product) => product.sku === '200-011-00001'));

  const detail = await requestJson('/api/products/200-011-00001');
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.product.sku, '200-011-00001');
  assert.match(detail.body.renderedDescription, /Electronic sights/);
});

test('editor previews markdown descriptions', async () => {
  const preview = await requestJson('/api/preview/markdown', {
    method: 'POST',
    body: JSON.stringify({ markdown: '**Bold** catalog text' }),
  });

  assert.equal(preview.response.status, 200);
  assert.match(preview.body.html, /<strong>Bold<\/strong>/);
});

test('editor rejects invalid product saves', async () => {
  const detail = await requestJson('/api/products/200-011-00001');
  const invalidProduct = { ...detail.body.product, name: '' };

  const save = await requestJson('/api/products/200-011-00001', {
    method: 'POST',
    body: JSON.stringify({ product: invalidProduct }),
  });

  assert.equal(save.response.status, 422);
  assert.equal(save.body.error, 'Product failed schema validation.');
  assert.ok(save.body.validationErrors.some((error) => error.path === '/name'));
});

test('editor saves an existing product and bumps the manifest version', async () => {
  const detail = await requestJson('/api/products/200-011-00001');
  const nextProduct = {
    ...detail.body.product,
    name: `${detail.body.product.name} Test Save`,
    description: `${detail.body.product.description}\n\nTemporary editor save test.`,
  };

  const save = await requestJson('/api/products/200-011-00001', {
    method: 'POST',
    body: JSON.stringify({ product: nextProduct }),
  });
  const expectedVersion = String(Number.parseInt(originalManifestVersion, 10) + 1);

  assert.equal(save.response.status, 200);
  assert.equal(save.body.ok, true);
  assert.equal(save.body.manifest.catalogVersion, expectedVersion);
  assert.equal(save.body.product.product.name, nextProduct.name);

  const savedProduct = JSON.parse(fs.readFileSync(productFile, 'utf8'));
  const savedManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert.equal(savedProduct.name, nextProduct.name);
  assert.equal(savedManifest.catalogVersion, expectedVersion);
});
