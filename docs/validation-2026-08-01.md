# Astro Migration Validation - 2026-08-01

Validation target: local production preview at `http://127.0.0.1:4324/` after `npm run prod`.

Note: this is a historical validation record. Later changes moved catalog/search cache versioning to `astro/data/catalog-manifest.json`.

## Cleanup

- Removed tracked Eleventy ignore configuration.
- Moved Astro-owned support page Markdown from `src/pages/` to `astro/content/pages/`.
- Moved catalog metadata JSON from `progdata/` to `astro/data/`.
- Regenerated and restored `package-lock.json` as a trackable dependency lockfile.
- Tightened `.gitignore` for dependencies, build output, generated reports, scratch files, and generated CSS.

## Build And Dependency Checks

- `npm install --package-lock-only`: passed, `0` vulnerabilities.
- `npm prune`: passed; removed stale extraneous local packages.
- `npm install --save-dev @playwright/test @axe-core/playwright lighthouse`: passed, `0` vulnerabilities.
- `npm audit --audit-level=moderate`: passed, `0` vulnerabilities.
- `npm ls --depth=0`: passed with only declared dependencies.
- `npm run prod`: passed; generated `1,504` pages.
- Static route smoke checks: passed for home, support, search, cart, representative department and product pages, search index JSON, service worker, and background image.

## Automated Regression Suite

- `npm test`: passed, `16` Playwright tests.
- Route smoke coverage samples home, support, search, cart, representative department pages, and a representative product page.
- Search regression checks verify `laser` returns `41` results and reuses the `csc-search-index:13` localStorage cache without another index request.
- Cart regression checks verify product add-to-cart, persisted quantity, increment behavior, totals, and removal.
- Keyboard regression checks verify keyboard activation paths for the side navigation, department menu, search, and header cart controls.
- axe regression checks pass with `0` violations on the sampled WCAG routes.

## Browser Parity

Representative Playwright checks passed in headless Chrome:

- Home, department, product, search, and cart routes return `200`.
- Each sampled route has the expected site title and one `main` landmark.
- No failed network requests or console errors were observed.
- Search for `laser` returns `41` results.
- Search creates one versioned local cache key: `csc-search-index:13`.
- Product add-to-cart persists to the shopping cart and updates totals.
- Cart quantity inputs have accessible names.

## Lighthouse

`npm run test:audit` passed against the production preview with desktop Lighthouse budgets. Reports are generated under `reports/lighthouse/`.

| Route | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| `/` | 100 | 100 | 100 | 100 |
| `/products/200-011-00001/` | 100 | 100 | 100 | 100 |
| `/departments/weapons/` | 100 | 100 | 100 | 100 |
| `/support/search/?s=laser` | 100 | 100 | 100 | 100 |
| `/shopping-cart/` | 100 | 100 | 100 | 100 |

Core observations:

- CLS was `0` on all sampled pages.
- Total blocking time was `0 ms` on all sampled desktop Lighthouse routes.
- Remaining Lighthouse improvement notes are image delivery and render-blocking/network dependency insights. These are optimization opportunities, not failing category scores.

Chrome DevTools MCP home-page trace:

- LCP: `106 ms`.
- CLS: `0.00`.
- No console errors.
- No failed network requests observed.
- One render-blocking request was identified: `/_astro/BaseLayout.fENgGlhs.css`, total duration `3 ms`, with no estimated savings.

## WCAG 2.2 AA

Automated axe checks passed with `0` violations on:

- `/`
- `/products/200-011-00001/`
- `/departments/weapons/`
- `/support/search/?s=laser`
- `/shopping-cart/`

WCAG cannot be fully certified by automation alone. Remaining manual checks before claiming conformance:

- Keyboard-only operation for side navigation, department menu, search, product purchase, and shopping cart edits.
- Visible focus order and focus retention after menu/cart/search state changes.
- Browser zoom at `200%` and text spacing overrides.
- Color contrast spot checks for all states, including hover/focus/disabled.
- Screen reader pass for header navigation, search results, product detail, and cart totals.

## Nielsen Heuristic Review

No blocking issues were found in a focused heuristic review of the sampled workflows.

- Visibility of system status: cart badge, cart totals, search loading/results count, and add-to-cart status are visible.
- Match with the real world: catalog, department, product, quantity, price, and cart language is domain-appropriate.
- User control and freedom: cart quantities can be increased, decreased, removed, or emptied.
- Consistency and standards: header navigation, search, department browsing, product pages, and cart interactions use consistent controls.
- Error prevention: quantity controls constrain values and cart/search storage failures degrade gracefully.
- Recognition rather than recall: departments remain available globally; search results display name, summary, image, and price.
- Flexibility and efficiency: search index is warmed and cached by version.
- Aesthetic and minimalist design: the UI is sparse and task-focused, though the legacy visual theme is intentionally distinctive.
- Help users recognize/recover from errors: search shows a user-facing fallback message if indexing fails.
- Help and documentation: support and licensing pages are present; full system documentation remains a recommended next step.

## Recommended Next Steps

1. Wire `npm test` and `npm run test:audit` into CI.
2. Expand Playwright coverage to mobile viewport navigation and additional high-traffic product/category pages.
3. Complete the remaining manual WCAG checks before claiming conformance.
4. Review image optimization opportunities if performance budgets become tighter.
