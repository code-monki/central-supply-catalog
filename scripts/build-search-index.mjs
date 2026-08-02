import path from 'node:path';
import { searchIndexPayload, writeSearchIndex } from '../astro/lib/generatedCatalogAssets.mjs';

const outIndex = process.argv.indexOf('--out');
const outFile = outIndex === -1 ? 'dist/_data/searchindex.json' : process.argv[outIndex + 1];

if (outIndex !== -1 && !outFile) {
  console.error('Usage: npm run build:search-index -- --out <path>');
  process.exit(1);
}

const payload = searchIndexPayload();
const writtenPath = writeSearchIndex(outFile);

console.log(
  `Search index written to ${path.relative(process.cwd(), writtenPath)}: ${payload.documents.length} documents, version ${payload.version}.`
);
