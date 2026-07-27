import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import fs from 'node:fs';
import path from 'node:path';
import { searchDocuments, searchIndexVersion } from './astro/lib/catalog.js';

const copyIfExists = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
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
  outDir: './astro-dist',
  integrations: [vue(), legacyPassthrough()],
  vite: {
    server: {
      fs: {
        allow: ['.'],
      },
    },
  },
});
