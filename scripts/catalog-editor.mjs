import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  allProducts,
  categories,
  departments,
  productImagePath,
  renderMarkdown,
} from '../astro/lib/catalog.mjs';

const rootDir = process.cwd();
const editorDir = path.join(rootDir, 'editor');
const port = Number(process.env.CSC_EDITOR_PORT || process.env.PORT || 4322);
const manifestPath = path.join(rootDir, 'astro/data/catalog-manifest.json');
const productRoot = path.join(rootDir, 'src/_data/products');
const productSchema = JSON.parse(fs.readFileSync(path.join(rootDir, 'schemas/product.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateProduct = ajv.compile(productSchema);
let editorProducts = allProducts();

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const send = (res, status, body, contentType = 'text/plain; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
};

const sendJson = (res, status, body) => {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        req.destroy();
        reject(new Error('Request body is too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const safeStaticPath = (baseDir, pathname) => {
  const requestedPath = path.resolve(baseDir, decodeURIComponent(pathname).replace(/^\/+/, ''));
  const resolvedBase = path.resolve(baseDir);
  return requestedPath.startsWith(`${resolvedBase}${path.sep}`) ? requestedPath : null;
};

const serveStatic = (res, baseDir, pathname) => {
  const filePath = safeStaticPath(baseDir, pathname);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;

  res.writeHead(200, {
    'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
};

const runCommand = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd: rootDir, shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });

const currentManifest = () => readJson(manifestPath);

const bumpManifestVersion = () => {
  const manifest = currentManifest();
  const numericVersion = Number.parseInt(manifest.catalogVersion, 10);
  manifest.catalogVersion = String(Number.isFinite(numericVersion) ? numericVersion + 1 : 1);
  writeJson(manifestPath, manifest);
  return manifest;
};

const productFileForSku = (sku) => {
  for (const dirName of fs.readdirSync(productRoot)) {
    const candidate = path.join(productRoot, dirName, `${sku}.json`);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
};

const readProductBySku = (sku) => {
  const file = productFileForSku(sku);
  if (!file) return null;

  const product = readJson(file);
  if (Array.isArray(product)) return null;

  return { file, product };
};

const validateProductRecord = (product) => {
  if (validateProduct(product)) return [];

  return (validateProduct.errors || []).map((error) => ({
    path: error.instancePath || '/',
    message: error.message,
  }));
};

const productSummary = (product) => ({
  sku: product.sku,
  name: product.name,
  cost: product.cost,
  departmentId: product.sku.split('-').slice(0, 2).join('-'),
  image: productImagePath(product) || '/img/products/no-image.png',
});

const productDetail = (product) => ({
  ...productSummary(product),
  description: product.description || '',
  renderedDescription: renderMarkdown(product.description || ''),
  product,
});

const handleApi = async (req, res, url) => {
  if (req.method === 'GET' && url.pathname === '/api/catalog') {
    sendJson(res, 200, {
      manifest: currentManifest(),
      categories,
      departments,
      products: editorProducts.map(productSummary),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/products/')) {
    const sku = decodeURIComponent(url.pathname.replace('/api/products/', ''));
    const found = readProductBySku(sku);

    if (!found) {
      sendJson(res, 404, { error: `Unknown SKU ${sku}` });
      return;
    }

    sendJson(res, 200, productDetail(found.product));
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/products/')) {
    const sku = decodeURIComponent(url.pathname.replace('/api/products/', ''));
    const found = readProductBySku(sku);

    if (!found) {
      sendJson(res, 404, { error: `Unknown SKU ${sku}` });
      return;
    }

    const body = JSON.parse(await readBody(req));
    const nextProduct = body.product;

    if (!nextProduct || typeof nextProduct !== 'object' || Array.isArray(nextProduct)) {
      sendJson(res, 400, { error: 'Request body must include a product object.' });
      return;
    }

    if (nextProduct.sku !== sku) {
      sendJson(res, 400, { error: 'Product SKU cannot be changed from this editor phase.' });
      return;
    }

    const validationErrors = validateProductRecord(nextProduct);
    if (validationErrors.length > 0) {
      sendJson(res, 422, { error: 'Product failed schema validation.', validationErrors });
      return;
    }

    writeJson(found.file, nextProduct);
    const manifest = body.bumpVersion === false ? currentManifest() : bumpManifestVersion();
    editorProducts = editorProducts.map((product) => (product.sku === sku ? nextProduct : product));

    sendJson(res, 200, {
      ok: true,
      manifest,
      product: productDetail(nextProduct),
      file: path.relative(rootDir, found.file),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/preview/markdown') {
    const body = JSON.parse(await readBody(req));
    sendJson(res, 200, { html: renderMarkdown(String(body.markdown || '')) });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/actions/validate') {
    sendJson(res, 200, await runCommand('npm', ['run', 'validate:data']));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/actions/rebuild-search-index') {
    sendJson(res, 200, await runCommand('npm', ['run', 'build:search-index']));
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
};

export const createCatalogEditorServer = () => http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }

    if (url.pathname === '/vendor/vue.esm-browser.js') {
      if (serveStatic(res, path.join(rootDir, 'node_modules/vue/dist'), '/vue.esm-browser.js')) return;
    }

    if (url.pathname.startsWith('/img/')) {
      if (serveStatic(res, path.join(rootDir, 'src'), url.pathname)) return;
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      if (serveStatic(res, editorDir, '/index.html')) return;
    }

    if (serveStatic(res, editorDir, url.pathname)) return;

    send(res, 404, 'Not found');
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createCatalogEditorServer().listen(port, () => {
    const scriptName = path.relative(rootDir, fileURLToPath(import.meta.url));
    console.log(`Catalog editor listening at http://localhost:${port}/`);
    console.log(`Started by ${scriptName}; set CSC_EDITOR_PORT to choose another port.`);
  });
}
