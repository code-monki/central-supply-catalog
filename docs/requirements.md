# Central Supply Catalog Requirements

## Scope

The Central Supply Catalog is a static catalog site for equipment and supplies used with Cepheus Engine and Traveller-compatible science-fiction role-playing games. The site must let users browse products, search the catalog, inspect product details, and maintain a local shopping cart without requiring a server-side application.

## Stakeholders

- Players and referees browsing catalog equipment.
- Contributors adding or correcting product data.
- Maintainers reviewing submissions, validating builds, and publishing static output.
- Rights holders and content stewards whose attribution and licensing requirements must be preserved.

## Functional Requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| FR-001 | Generate a static home page with catalog entry points and global navigation. | TST-001, TST-006 |
| FR-002 | Generate department and paginated department listing pages from catalog data. | TST-001, TST-006 |
| FR-003 | Generate one product detail page per product SKU. | TST-001, TST-003, TST-006 |
| FR-004 | Provide global navigation to home, cart, help, support, about, departments, and search. | TST-001, TST-005, TST-006 |
| FR-005 | Provide deterministic product search from a generated search payload, including terms, quoted phrases, boolean operators, and grouped expressions. | TST-002, TST-006, TST-013 |
| FR-006 | Cache search documents in browser `localStorage` by version. | TST-002 |
| FR-007 | Let users add products to a local shopping cart. | TST-003 |
| FR-008 | Let users view, increment, decrement, remove, and clear cart items. | TST-003 |
| FR-009 | Persist cart contents locally across page navigation. | TST-003 |
| FR-010 | Preserve product content attribution and licensing notices. | TST-001, TST-009 |
| FR-011 | Serve legacy-compatible static asset paths for images, audio, search payload, and service worker. | TST-001, TST-007 |
| FR-012 | Provide support, about, licensing, and disclaimer content. | TST-001, TST-009 |
| FR-013 | Provide user help for catalog browsing, product details, cart behavior, and supported search syntax. | TST-001, TST-006, TST-013 |

## Nonfunctional Requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-001 | The production site must be statically generated and deployable to a static host. | TST-007 |
| NFR-002 | The site must not require a runtime database or application server for browsing/search/cart workflows. | TST-007, TST-008 |
| NFR-003 | Representative pages must pass automated accessibility regression checks with no axe violations. | TST-006 |
| NFR-004 | Manual accessibility validation must be documented before claiming WCAG conformance. | TST-009 |
| NFR-005 | Representative production routes must meet Lighthouse budget thresholds. | TST-008 |
| NFR-006 | Dependency audit must pass at the configured moderate severity threshold. | TST-010 |
| NFR-007 | Declared dependency tree must be clean. | TST-011 |
| NFR-008 | Product routes, search results, and cart records must use stable SKU identifiers. | TST-002, TST-003 |
| NFR-009 | Generated artifacts and local reports must remain outside source control. | TST-012 |
| NFR-010 | The project must remain understandable to contributors using ordinary files, pull requests, and static build commands. | TST-007, TST-009 |
| NFR-011 | Catalog source files must pass JSON Schema and cross-file consistency validation before publication. | TST-014 |

## Constraints

- The site must preserve existing public URL patterns where practical.
- The data store must be reviewable in source control.
- Content licensing terms and attribution metadata must not be collapsed into the code license.
- Browser storage is acceptable for search caching and cart persistence because these are user-local convenience features.
- The catalog is read-heavy and build-time generated; write workflows occur through repository changes rather than runtime CRUD screens.

## Out Of Scope

- Server-side checkout, payment, or order fulfillment.
- User accounts and authenticated cart sync.
- Runtime administrative editing UI.
- Runtime relational querying across user data.
- Formal WCAG certification by automation alone.
