# Filesystem And Index Storage Rationale

## Decision

The Central Supply Catalog uses repository files as the source of truth and generated indexes for runtime lookup instead of a traditional runtime relational database management system.

## Context

The catalog is mostly read-only at runtime. Product and metadata changes are contributor-driven and reviewed through source control. The published site only needs to browse, search, display product details, and maintain user-local cart state.

## Current Storage Model

- Product and catalog source data lives in repository files under `src/_data/`.
- Astro metadata lives in `astro/data/`.
- Build code in `astro/lib/catalog.mjs` loads and normalizes those files.
- Product and department pages are generated at build time.
- `/_data/searchindex.json` is generated at build time for browser search.
- Browser search documents are cached in `localStorage` by version.
- Cart contents are stored in browser `localStorage`.
- The service worker precaches the search payload and provides network-first cache fallback.

## Why Not A Runtime RDBMS

### Hosting Simplicity

A filesystem-backed static build can be hosted by GitHub Pages, Netlify, Cloudflare Pages, or any ordinary static host. A runtime RDBMS would require database hosting, migrations, secrets, backups, network access, and operational monitoring.

### Read-Heavy Access Pattern

The catalog is read-heavy and write-light. Most users browse and search existing content. Runtime relational querying is unnecessary for the current public workflows.

### Contributor Workflow

File-based data is reviewable in pull requests. Maintainers can see exactly which products, metadata records, images, or attribution entries changed. This is simpler than reviewing opaque database mutations.

### Reproducibility

The entire published catalog can be regenerated from a repository checkout. Build output is deterministic enough for validation and review, and no external database snapshot is required to reproduce the site.

### Licensing And Attribution

Content attribution and licensing metadata remain near the source data and can be reviewed with content changes. This supports careful handling of third-party and game-system content.

### Cost And Maintenance

Static hosting plus source-controlled data has lower operating cost and fewer failure modes than maintaining a database-backed application.

### Offline And Client-Side Behavior

The generated search payload, browser cache, and service worker support fast repeat access without requiring a live query server. Cart state is intentionally user-local and does not require a shared database.

## Why Generate An Index

Generating an index decouples authoring from runtime search:

- Source data can remain contributor-readable.
- Search payloads can be optimized for the browser.
- Search cache versioning can invalidate stale browser data.
- The site can search without a server-side query endpoint.
- Static hosting remains sufficient.

## Tradeoffs

| Tradeoff | Impact | Mitigation |
| --- | --- | --- |
| No runtime relational queries | Complex ad hoc filtering is harder. | Add generated indexes or client-side filters for known use cases. |
| Build-time validation matters more | Bad source data can affect generated pages. | Add schema/data validation tests before publish. |
| Large payloads can affect browser performance | Search payload size may grow. | Split indexes by department or prebuild normalized search fields if needed. |
| No runtime edit UI | Contributors must use repository workflows. | Document contribution process and data schema. |
| User cart is device-local | Cart does not sync across devices. | Accept as current scope; add accounts only if requirements change. |

## When To Reconsider An RDBMS

Revisit this decision if the project needs:

- Authenticated users.
- Shared carts or saved lists.
- Runtime product submissions or moderation.
- High-volume write workflows.
- Complex relational reporting.
- Personalized recommendations.
- Fine-grained authorization.
- Public APIs requiring dynamic queries.

Until those requirements exist, a filesystem source of truth plus generated indexes is the simpler and more appropriate architecture.
