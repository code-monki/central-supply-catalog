# Central Supply Catalog System

This document describes the Astro/Vue implementation that builds and serves the Central Supply Catalog.

For the complete documentation set, see [documentation-index.md](documentation-index.md).

## Architecture

- Astro owns routing, static generation, layouts, and legacy asset passthrough.
- Vue islands own interactive header search/menu behavior, product purchase controls, search results, and the shopping cart.
- Catalog source data remains under `src/_data/`.
- Astro-owned Markdown support content lives under `astro/content/pages/`.
- Catalog metadata used by Astro helpers lives under `astro/data/`.
- `astro/data/catalog-manifest.json` stores the catalog version used to invalidate generated search and service-worker caches.
- Legacy static assets are copied from `src/img/`, `src/audio/`, and `src/sw.js` into `dist/` during `astro:build:done`.

## Routing

Static routes are defined under `astro/pages/`.

- `/` renders the catalog home page.
- `/about-the-central-supply-catalog/`, `/disclaimers/`, `/help/`, `/support/`, and `/support/search/` render informational and support content.
- `/shopping-cart/` renders the Vue cart island.
- `/departments/[...page]` renders department and paginated department pages from catalog data.
- `/products/[sku]` renders every product page from catalog data.
- `/_data/searchindex.json`, `/img/*`, `/audio/*`, and `/sw.js` are legacy-compatible generated or copied assets.

## Data Model

Product records are loaded from JSON files under `src/_data/products/` by `astro/lib/catalog.mjs`. Metadata JSON files in `astro/data/` describe categories, departments, manufacturers, publishers, attribution records, and the catalog manifest.

Generated product pages use the product SKU as the stable route key. Department pages are generated from category and department metadata, with pagination for large product sets.

## Search

`astro/lib/catalog.mjs` generates search documents, and `astro/lib/generatedCatalogAssets.mjs` serializes the search payload at `/_data/searchindex.json`. The client search code lives in `astro/lib/catalogSearch.mjs`, `astro/lib/searchIndexClient.js`, and `astro/components/SearchResults.vue`.

The search parser supports adjacent terms as `AND`, quoted phrases, `AND`, `OR`, `NOT`, and parenthesized groups. User-facing search syntax is documented on `/help/`; implementation details are documented in [site-search.md](site-search.md).

Search documents are cached in `localStorage` with keys shaped as `csc-search-index:<version>`. The current version is read from `catalogVersion` in `astro/data/catalog-manifest.json` through `searchIndexVersion()` in `astro/lib/catalog.mjs`. When a new version is written, stale `csc-search-index:*` keys are removed.

## Shopping Cart

The cart is client-side only and is stored in `localStorage` under `csc-cart`.

Each cart entry uses:

```json
{
  "sku": "200-011-00001",
  "qty": 1,
  "name": "Advanced Combat Rifle",
  "unitPrice": 1000,
  "image": "/img/products/200-011-00001.png"
}
```

`ProductPurchase.vue` appends or increments items. `ShoppingCart.vue` reads, edits, removes, and clears items. Components dispatch `csc-cart-updated` so the header badge can update in the same tab.

## Service Worker

`src/sw.js` is rendered to `/sw.js` during the Astro build with the manifest catalog version substituted into the cache name. It precaches `/_data/searchindex.json`, cleans up older `csc-cache-v*` caches during activation, and uses a network-first strategy with cache fallback for GET requests.

The manifest catalog version should be incremented when product data, search data, cached behavior, or precached assets change.

## Styling

Global styles live in `src/css/main.css` and are imported by `astro/layouts/BaseLayout.astro`. The project intentionally keeps the legacy catalog visual identity. New CSS should preserve accessible focus states, named form controls, and stable dimensions for interactive controls.

## Build And Deploy

Common commands:

```bash
npm install
npm run prod
npm run preview -- --host 127.0.0.1 --port 4324
npm run build:search-index
npm run validate:data
npm test
npm run test:audit
npm run editor
```

The production build writes static output to `dist/`. GitHub Pages or another static host should publish `dist/` with clean URL support for generated `index.html` routes.

`npm run build:search-index` regenerates `dist/_data/searchindex.json` from the source catalog without running a full Astro build. `npm run editor` starts the local catalog editor shell, which can browse current catalog data, edit existing products, preview product Markdown, run validation, and rebuild the search index.

## Validation

Automated regression coverage:

- `npm test` runs Playwright route smoke tests, search cache checks, cart workflow checks, keyboard navigation basics, axe WCAG regression checks, and editor API tests.
- `npm run test:editor` verifies editor catalog APIs, Markdown preview, invalid-save handling, product save writes, and manifest version bump behavior.
- `npm run validate:data` validates catalog manifest, metadata, product JSON shape, SKU uniqueness, department-derived file placement, and product cross-references.
- `npm run build:search-index` verifies that the generated search payload can be rebuilt from source catalog data.
- `npm run test:audit` builds the site, serves the production preview, runs Lighthouse for sampled routes, and writes JSON reports to `reports/lighthouse/`.
- `.github/workflows/validation.yml` runs dependency audit, dependency tree checks, catalog data validation, search-index rebuild, production build, browser regression tests, and Lighthouse budgets for pushes and pull requests.

Manual accessibility validation is still required before claiming WCAG 2.2 AA conformance. Cover keyboard-only operation, visible focus order, 200% zoom, text spacing overrides, state contrast, and screen reader behavior for navigation, search, product purchase, and cart totals.

## Licensing And Attribution

Code licensing is documented in `LICENSE-CODE.md`. Content licensing is documented in `LICENSE-CONTENT.md`, `NOTICE.md`, and source attribution metadata. Product content, images, and third-party material must keep attribution records current when catalog data changes.
