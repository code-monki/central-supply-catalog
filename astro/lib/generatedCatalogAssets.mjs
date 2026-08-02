import fs from 'node:fs';
import path from 'node:path';
import { searchDocuments, searchIndexVersion } from './catalog.mjs';

export const searchIndexPayload = () => ({
  version: searchIndexVersion(),
  documents: searchDocuments(),
});

export const searchIndexJson = () => JSON.stringify(searchIndexPayload());

export const renderServiceWorker = () =>
  fs.readFileSync('src/sw.js', 'utf8').replaceAll('__CATALOG_VERSION__', searchIndexVersion());

export const writeSearchIndex = (outFile = 'dist/_data/searchindex.json') => {
  const resolvedOutFile = path.resolve(outFile);
  fs.mkdirSync(path.dirname(resolvedOutFile), { recursive: true });
  fs.writeFileSync(resolvedOutFile, searchIndexJson());
  return resolvedOutFile;
};
