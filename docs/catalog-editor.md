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
- GitHub Actions runs the validator before building and testing the site.

## Proposed Phases

1. Read-only local catalog browser with product filtering and rendered description preview.
2. Existing-product edit form with JSON Schema validation and normalized save.
3. Create-product wizard with SKU helper, department-derived file placement, and manifest version bump.
4. Git workflow controls for dirty-worktree checks, staged diff preview, commit, push, and validation before commit.
5. Optional Tauri wrapper if a packaged desktop app is needed.

## Non-Goals

- Runtime database-backed public site.
- Runtime product editing on the published static site.
- User accounts, moderation queues, or hosted administrative APIs.
