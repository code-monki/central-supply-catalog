# Requirements Traceability Matrix

This matrix maps requirements from [requirements.md](requirements.md) to design, architecture, implementation, and verification artifacts.

## Functional Requirements

| Requirement | Design | Architecture / Implementation | Verification |
| --- | --- | --- | --- |
| FR-001 Static home page | `docs/design.md` | `astro/pages/index.astro`, `astro/layouts/BaseLayout.astro` | TST-001, TST-006 |
| FR-002 Department pages | `docs/design.md` | `astro/pages/departments/[...page].astro`, `astro/lib/catalog.mjs` | TST-001, TST-006 |
| FR-003 Product pages | `docs/design.md` | `astro/pages/products/[sku].astro`, `astro/lib/catalog.mjs` | TST-001, TST-003, TST-006 |
| FR-004 Global navigation | `docs/design.md` | `astro/components/SiteHeader.vue` | TST-001, TST-005, TST-006 |
| FR-005 Deterministic product search | `docs/design.md`, `docs/site-search.md` | `astro/components/SearchResults.vue`, `astro/lib/catalogSearch.mjs`, `astro/lib/searchIndexClient.js`, `astro/lib/catalog.mjs` | TST-002, TST-006, TST-013 |
| FR-006 Versioned search cache | `docs/design.md`, `docs/site-search.md` | `astro/lib/searchIndexClient.js` | TST-002 |
| FR-007 Add products to cart | `docs/design.md` | `astro/components/ProductPurchase.vue` | TST-003 |
| FR-008 Edit cart items | `docs/design.md` | `astro/components/ShoppingCart.vue` | TST-003 |
| FR-009 Persist cart locally | `docs/design.md`, `docs/localstorage.md` | `astro/components/ProductPurchase.vue`, `astro/components/ShoppingCart.vue` | TST-003, TST-004 |
| FR-010 Preserve attribution/licensing | `docs/requirements.md` | `astro/data/attributions.json`, `src/util/attributions.js`, `LICENSE-CONTENT.md`, `NOTICE.md` | TST-001, TST-009 |
| FR-011 Legacy static asset paths | `docs/architecture.md` | `astro.config.mjs`, `src/img/`, `src/audio/`, `src/sw.js` | TST-001, TST-007 |
| FR-012 Support/about/licensing content | `docs/design.md` | `astro/content/pages/`, `astro/pages/support.astro`, `astro/pages/about-the-central-supply-catalog.astro`, `astro/pages/disclaimers.astro` | TST-001, TST-009 |
| FR-013 User help | `docs/design.md` | `astro/pages/help.astro`, `astro/content/pages/help.md`, `astro/components/SiteHeader.vue` | TST-001, TST-006, TST-013 |

## Nonfunctional Requirements

| Requirement | Architecture / Implementation | Verification |
| --- | --- | --- |
| NFR-001 Static deployment | `docs/architecture.md`, `astro.config.mjs` | TST-007 |
| NFR-002 No runtime database/server | `docs/data-storage-rationale.md`, `docs/architecture.md` | TST-007, TST-008 |
| NFR-003 Automated accessibility regression | `tests/catalog.spec.mjs`, `@axe-core/playwright` | TST-006 |
| NFR-004 Manual accessibility caveats | `docs/test-plan.md`, `docs/validation-2026-08-01.md` | TST-009 |
| NFR-005 Performance budgets | `scripts/lighthouse-budget.mjs` | TST-008 |
| NFR-006 Dependency audit | `package-lock.json`, GitHub Actions workflow | TST-010 |
| NFR-007 Clean dependency tree | `package.json`, `package-lock.json` | TST-011 |
| NFR-008 Stable SKU identifiers | `src/_data/`, `astro/lib/catalog.mjs`, Vue cart/search components | TST-002, TST-003 |
| NFR-009 Generated artifact hygiene | `.gitignore` | TST-012 |
| NFR-010 Contributor-readable file workflow | `docs/data-storage-rationale.md`, repository file layout | TST-007, TST-009 |
| NFR-011 Catalog data validation | `schemas/*.schema.json`, `scripts/validate-data.mjs`, `.github/workflows/validation.yml` | TST-014 |

## Test Case References

Test case definitions live in [test-plan.md](test-plan.md).
