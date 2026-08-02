# Catalog Editor Direction

## Decision

The catalog editor should begin as a Node/Vue local web application launched from this repository, not as a separate Electron or Python/FastAPI application.

## Rationale

- The site already uses Node, Astro, Vue, `markdown-it`, and npm scripts.
- Existing catalog parsing, Markdown rendering, search payload generation, and build behavior are implemented in JavaScript.
- A local Node server can read and write repository files directly while reusing the same schema and validation logic as CI.
- A browser-based UI is well suited to product forms, catalog filtering, Markdown/HTML preview, validation messages, and diff previews.
- Electron or Tauri packaging can be added later if an installable desktop application becomes useful.

## Foundation

The editor should build on these repository-level controls:

- `astro/data/catalog-manifest.json` stores the catalog version used for search and service-worker cache invalidation.
- `schemas/*.schema.json` define formal source-data schemas.
- `npm run validate:data` validates manifest, metadata, product shape, SKU uniqueness, department-derived file placement, and product cross-references.
- `npm run build:search-index` rebuilds the generated search payload from canonical catalog JSON.
- `npm run editor` starts the local browser-based editor shell.
- GitHub Actions runs the validator before building and testing the site.

## Current Editor Phase

The current implementation supports read-only browsing, existing-product edits, new product creation, taxonomy management, and richer product metadata editing. It provides:

- Local Node HTTP server at `http://localhost:4322/` by default.
- Product filtering by name, SKU, and department.
- Department/Sub-department selection for new product creation.
- Department/Sub-department management for catalog taxonomy.
- Next-SKU allocation from the selected SKU-bearing sub-department.
- Department-derived target file placement for new products.
- Product edit form for the common scalar fields: name, manufacturer, cost, mass, size, tech level, QREBS, damage, displacement, image path, and description.
- Text-list controls for tags, categories, and accessory SKU references.
- JSON controls for sources, variants, and stats, preserving the existing source data shape for complex product records.
- Product description preview using the same Markdown renderer as the public site.
- Server-side JSON Schema validation before saving.
- Normalized JSON writes with canonical top-level product field ordering for existing product files.
- Normalized JSON writes with canonical top-level product field ordering for newly created product files.
- Normalized JSON writes for Department and Sub-department metadata files.
- Automatic `catalogVersion` increment in `astro/data/catalog-manifest.json` after a successful product or taxonomy save.
- Local actions for `npm run validate:data` and `npm run build:search-index`.
- Git workflow controls for repository status, diff preview, validation before commit, commit, and push.
- Automated editor API tests through `npm run test:editor`.

The editor presents top-level entries from `astro/data/categories.json` as Departments and SKU-bearing records from `astro/data/departments.json` as Sub-departments. The underlying data file names remain unchanged for now.

## Proposed Phases

1. Read-only local catalog browser with product filtering and rendered description preview. Complete.
2. Existing-product edit form with JSON Schema validation and normalized save. Complete.
3. Create-product wizard with SKU helper, department-derived file placement, and manifest version bump. Complete.
4. Git workflow controls for dirty-worktree checks, diff preview, commit, push, and validation before commit. Complete.
5. Department/Sub-department management with assignment, validation, and product directory creation. Complete.
6. Rich product metadata editing for common fields, list fields, and complex JSON fields. Complete.
7. Optional Tauri wrapper if a packaged desktop app is needed.

## Data Organization Guidance

The current one-JSON-file-per-product structure remains the right default for this project. It is easy to review in Git, fits the static-site build model, avoids runtime infrastructure, and keeps catalog updates suitable for pull requests.

Near-term organization improvements should focus on generated and validated structure rather than introducing a database:

- Keep product files canonical by SKU and product directory.
- Keep `astro/data/catalog-manifest.json` as the explicit catalog version source.
- Keep Departments in `astro/data/categories.json` and SKU-bearing Sub-departments in `astro/data/departments.json`.
- Generate search indexes and lookup indexes from product JSON instead of maintaining them by hand.
- Enforce product shape, SKU placement, image existence, and cross-references through validator scripts.
- Use stable top-level field ordering in editor writes so product diffs are easier to review.

If the data set grows substantially, the next useful split would be generated companion indexes such as `products-by-sku`, `products-by-department`, or an image inventory. Splitting each product into multiple source files or adding an RDBMS should wait until there is a concrete editing or validation problem that the current filesystem model cannot solve cleanly.

## Non-Goals

- Runtime database-backed public site.
- Runtime product editing on the published static site.
- User accounts, moderation queues, or hosted administrative APIs.
