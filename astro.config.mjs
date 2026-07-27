import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import fs from 'node:fs';
import path from 'node:path';

const copyIfExists = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
};

const legacyPassthrough = () => ({
  name: 'legacy-passthrough',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const outDir = dir.pathname;
      copyIfExists('src/img', path.join(outDir, 'img'));
      copyIfExists('src/audio', path.join(outDir, 'audio'));
      copyIfExists('src/sw.js', path.join(outDir, 'sw.js'));

      const dataDir = path.join(outDir, '_data');
      fs.mkdirSync(dataDir, { recursive: true });
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
