# Central Supply Catalog Design

## Design Goals

- Present a browsable, game-table-friendly product catalog.
- Keep the site fast, static, and easy to host.
- Preserve the legacy Central Supply Catalog visual identity while improving semantic structure and accessibility.
- Keep contribution workflows centered on files and pull requests.
- Avoid introducing server infrastructure where build-time generation is sufficient.

## User Workflows

### Browse Catalog

Users land on the home page, open the departments menu, choose a department, and browse product cards. Large departments are paginated.

### Search Catalog

Users enter a search term in the global search form. The search page loads the generated search payload, builds a MiniSearch index in the browser, displays matching products, and caches the payload by version.

### Inspect Product

Users open a product detail page by SKU. Product pages show image, description, cost, metadata, attribution, and purchase controls.

### Manage Cart

Users add products from product detail pages. Cart contents are persisted in `localStorage`, can be edited on the cart page, and are reflected by the global cart badge.

### Review Support And Licensing

Users can reach support, about, disclaimer, and licensing content through global navigation and footer links.

## Information Architecture

- Home page: catalog entry and global navigation.
- Department pages: category and department browsing.
- Product pages: detailed item records.
- Search page: query result display.
- Shopping cart: local item summary and quantity controls.
- About page: project background and credits.
- Disclaimers page: licensing, attribution, publisher notices, and third-party content disclaimers.
- Support page: help, contact, repository, issue, and discussion links.

## Interaction Design

- Header controls are globally available.
- The side navigation and department menu are keyboard reachable.
- Search uses ordinary query parameters so URLs can be shared.
- Cart controls use native buttons and number inputs.
- Status messages use accessible roles where state changes need feedback.

## Responsive Design

The project uses custom CSS rather than a component framework. Historical design notes reference Bootstrap breakpoints as a planning baseline, but Bootstrap is not a runtime dependency. Responsive behavior is implemented in `src/css/main.css`.

## Accessibility Design

- Pages use one main landmark.
- Interactive controls have accessible names.
- Form labels are present, visually hidden where appropriate.
- Focus styling must remain visible.
- Automated axe checks are regression gates, but manual keyboard, zoom, contrast, and screen reader checks are still required.

## Visual Design

The design intentionally preserves the legacy catalog theme. New UI should prefer utilitarian controls, stable dimensions, readable text, and restrained changes over wholesale redesign.
