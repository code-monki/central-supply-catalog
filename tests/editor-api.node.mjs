import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, test } from 'node:test';
import { createCatalogEditorServer } from '../scripts/catalog-editor.mjs';

const productFile = 'src/_data/products/weapon-accessories/200-011-00001.json';
const createdProductFile = 'src/_data/products/weapon-accessories/200-011-00029.json';
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
  fs.rmSync(createdProductFile, { force: true });
  server = createCatalogEditorServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  fs.rmSync(createdProductFile, { force: true });
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

test('editor serves git workflow status and diff data', async () => {
  const status = await requestJson('/api/git/status');
  assert.equal(status.response.status, 200);
  assert.equal(typeof status.body.branch, 'string');
  assert.equal(typeof status.body.commit, 'string');
  assert.equal(typeof status.body.dirty, 'boolean');
  assert.ok(Array.isArray(status.body.files));

  const diff = await requestJson('/api/git/diff');
  assert.equal(diff.response.status, 200);
  assert.equal(typeof diff.body.stdout, 'string');
  assert.equal(typeof diff.body.stderr, 'string');
});

test('editor rejects commit requests without a message', async () => {
  const commit = await requestJson('/api/git/commit', {
    method: 'POST',
    body: JSON.stringify({ message: '   ' }),
  });

  assert.equal(commit.response.status, 400);
  assert.equal(commit.body.ok, false);
  assert.equal(commit.body.stderr, 'Commit message is required.');
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

test('editor allocates the next product SKU for a department', async () => {
  const allocation = await requestJson('/api/departments/200-011/next-sku');

  assert.equal(allocation.response.status, 200);
  assert.equal(allocation.body.departmentId, '200-011');
  assert.equal(allocation.body.departmentLabel, 'Weapon Accessories');
  assert.equal(allocation.body.sku, '200-011-00029');
  assert.equal(allocation.body.file, createdProductFile);
  assert.equal(allocation.body.product.sku, '200-011-00029');
});

test('editor rejects SKU allocation for an unknown department', async () => {
  const allocation = await requestJson('/api/departments/999-999/next-sku');

  assert.equal(allocation.response.status, 404);
  assert.equal(allocation.body.error, 'Unknown department 999-999');
});

test('editor rejects create requests that do not use the allocated SKU', async () => {
  const allocation = await requestJson('/api/departments/200-011/next-sku');
  const product = {
    ...allocation.body.product,
    sku: '200-011-00030',
    name: 'Temporary Editor Test Product',
    description: 'Temporary editor create test.',
    qrebs: 'R=0',
    sources: [
      {
        publication: 'Editor Test Fixture',
        authors: ['Central Supply Catalog'],
        publisher: 'Central Supply Catalog'
      }
    ],
  };

  const create = await requestJson('/api/products', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });

  assert.equal(create.response.status, 409);
  assert.equal(create.body.nextSku, '200-011-00029');
});

test('editor creates a new product and bumps the manifest version', async () => {
  const manifestBeforeCreate = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const allocation = await requestJson('/api/departments/200-011/next-sku');
  const product = {
    ...allocation.body.product,
    name: 'Temporary Editor Test Product',
    cost: 12,
    techLevel: 9,
    qrebs: 'R=0',
    description: '<p>Temporary editor create test.</p>',
    categories: ['weapons', 'weapon accessory'],
    tags: ['products', 'weapons', 'weapon accessory'],
    sources: [
      {
        publication: 'Editor Test Fixture',
        authors: ['Central Supply Catalog'],
        publisher: 'Central Supply Catalog'
      }
    ],
  };
  const expectedVersion = String(Number.parseInt(manifestBeforeCreate.catalogVersion, 10) + 1);

  const create = await requestJson('/api/products', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });

  assert.equal(create.response.status, 201);
  assert.equal(create.body.ok, true);
  assert.equal(create.body.file, createdProductFile);
  assert.equal(create.body.manifest.catalogVersion, expectedVersion);

  const savedProduct = JSON.parse(fs.readFileSync(createdProductFile, 'utf8'));
  const savedManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert.equal(savedProduct.sku, '200-011-00029');
  assert.equal(savedProduct.name, 'Temporary Editor Test Product');
  assert.equal(savedManifest.catalogVersion, expectedVersion);

  const duplicate = await requestJson('/api/products', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });
  assert.equal(duplicate.response.status, 409);
});
