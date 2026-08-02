# Central Supply Catalog Architecture

## Overview

The Central Supply Catalog is a statically generated Astro site with Vue islands for interactive browser features. Catalog content is read from repository files at build time. The build emits HTML routes, bundled client assets, legacy static assets, and a generated search payload.

## Runtime Model

The production runtime is a static file host.

```text
Repository files -> Astro build -> dist/ -> static host -> browser
```

There is no runtime application server and no runtime database dependency. Browser-only features use `localStorage`, Cache Storage, and client-side JavaScript.

## Major Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Astro pages | `astro/pages/` | Static route generation for home, informational Markdown pages, support, cart, departments, and products. |
| Base layout | `astro/layouts/BaseLayout.astro` | Shared document shell, global styles, header, and footer. |
| Catalog library | `astro/lib/catalog.mjs` | Loads catalog files, computes routes, formats records, and builds search documents. |
| Vue header | `astro/components/SiteHeader.vue` | Side navigation, department menu, search submit, and cart badge. |
| Search results | `astro/components/SearchResults.vue`, `astro/lib/catalogSearch.mjs` | Browser-side query parsing, catalog search execution, and result rendering. |
| Product purchase | `astro/components/ProductPurchase.vue` | Add-to-cart behavior from product pages. |
| Shopping cart | `astro/components/ShoppingCart.vue` | Cart display, quantity editing, removal, and clearing. |
| Search cache client | `astro/lib/searchIndexClient.js` | Versioned search payload loading and `localStorage` caching. |
| Service worker | `src/sw.js` | Search payload precache and network-first cache fallback. |
| Global CSS | `src/css/main.css` | Legacy visual theme and responsive styling. |

## Data Flow

1. Product and metadata files are read from `src/_data/` and `astro/data/`.
2. `astro/lib/catalog.mjs` normalizes the data for route generation, page props, menu data, attribution lookup, and search documents.
3. Astro generates product and department pages at build time.
4. The build writes `/_data/searchindex.json` with a version and document array.
5. The browser loads search documents on demand or during idle warming.
6. Search documents are cached in `localStorage` under `csc-search-index:<version>`.
7. Cart entries are stored in `localStorage` under `csc-cart`.

## Deployment Artifacts

`npm run prod` writes static output to `dist/`.

Astro generates:

- HTML route files.
- Bundled JavaScript and CSS under `/_astro/`.
- Generated search payload under `/_data/searchindex.json`.

The custom Astro integration copies:

- `src/img/` to `/img/`.
- `src/audio/` to `/audio/`.
- `src/sw.js` to `/sw.js`.

## Storage Architecture

The catalog uses repository files as the source of truth and generated indexes for runtime lookup. See [data-storage-rationale.md](data-storage-rationale.md) for the rationale for using filesystem data and generated indexes instead of a traditional RDBMS.

## Quality Gates

Validation runs through:

- Production build.
- Playwright browser regression suite.
- axe accessibility regression checks.
- Lighthouse desktop budget checks.
- npm dependency audit.
- Declared dependency tree check.

The GitHub Actions workflow in `.github/workflows/validation.yml` runs these gates for pushes and pull requests.
