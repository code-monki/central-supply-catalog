import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import fs from 'node:fs';
import path from 'node:path';
import { searchDocuments, searchIndexVersion } from './astro/lib/catalog.mjs';

const copyIfExists = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
};

const contentTypes = {
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
};

const serveStaticFile = (sourceDir) => (req, res, next) => {
  const url = new URL(req.url, 'http://localhost');
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(sourceDir, relativePath);
  const rootPath = path.resolve(sourceDir);

  if (!filePath.startsWith(`${rootPath}${path.sep}`)) {
    next();
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    next();
    return;
  }

  res.setHeader('Content-Type', contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
};

const legacyPassthrough = () => ({
  name: 'legacy-passthrough',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/_data/searchindex.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            version: searchIndexVersion(),
            documents: searchDocuments(),
          })
        );
      });
      server.middlewares.use('/img', serveStaticFile('src/img'));
      server.middlewares.use('/audio', serveStaticFile('src/audio'));
      server.middlewares.use('/sw.js', serveStaticFile('src'));
    },
    'astro:build:done': ({ dir }) => {
      const outDir = dir.pathname;
      copyIfExists('src/img', path.join(outDir, 'img'));
      copyIfExists('src/audio', path.join(outDir, 'audio'));
      copyIfExists('src/sw.js', path.join(outDir, 'sw.js'));

      const dataDir = path.join(outDir, '_data');
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(
        path.join(dataDir, 'searchindex.json'),
        JSON.stringify({
          version: searchIndexVersion(),
          documents: searchDocuments(),
        })
      );
      for (const file of fs.readdirSync('src/_data').filter((item) => item.endsWith('.idx'))) {
        fs.copyFileSync(path.join('src/_data', file), path.join(dataDir, file));
      }
    },
  },
});

export default defineConfig({
  srcDir: './astro',
  outDir: './dist',
  integrations: [vue(), legacyPassthrough()],
  vite: {
    server: {
      fs: {
        allow: ['.'],
      },
    },
  },
});
