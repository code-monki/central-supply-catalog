import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allProducts,
  catalogManifest,
  categories,
  departments,
  productImagePath,
  renderMarkdown,
} from '../astro/lib/catalog.mjs';

const rootDir = process.cwd();
const editorDir = path.join(rootDir, 'editor');
const port = Number(process.env.CSC_EDITOR_PORT || process.env.PORT || 4322);

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
});

const handleApi = async (req, res, url) => {
  if (req.method === 'GET' && url.pathname === '/api/catalog') {
    sendJson(res, 200, {
      manifest: catalogManifest,
      categories,
      departments,
      products: allProducts().map(productSummary),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/products/')) {
    const sku = decodeURIComponent(url.pathname.replace('/api/products/', ''));
    const product = allProducts().find((item) => item.sku === sku);

    if (!product) {
      sendJson(res, 404, { error: `Unknown SKU ${sku}` });
      return;
    }

    sendJson(res, 200, productDetail(product));
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

const server = http.createServer(async (req, res) => {
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

server.listen(port, () => {
  const scriptName = path.relative(rootDir, fileURLToPath(import.meta.url));
  console.log(`Catalog editor listening at http://localhost:${port}/`);
  console.log(`Started by ${scriptName}; set CSC_EDITOR_PORT to choose another port.`);
});
