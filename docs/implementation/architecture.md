# 1. Architecture and dependency choices

The implementation keeps the screen small while giving the backend ownership of the figures it displays. The main trade-off is doing a little more preparation on the server now so that chart correctness does not depend on loading every table row later.

## 1.1. Frontend

React and TypeScript render one Clients page. Vite builds the application, SCSS Modules scope page/component styling, and CSS custom properties hold the small set of shared visual tokens. Inter is bundled locally. The warm surface, compact table, restrained controls, and chart colors follow the reference design.

`shared/clients.ts` defines and validates the API contract, channel vocabulary, and child traversal. `/api/clients` returns `{ months, data }`: ordered unique reporting months in `YYYY-MM` format and the company hierarchy (or `data: null`). Each node supplies:

- `id`, `name`, `kind`, and the original `values` aligned with `months`;
- `avatarUrl`, an explicit URL or `null`;
- `chart`, one row per month containing `known` channel counts in the shared channel order, `missing` balance, and `excess` over the reported total;
- `hasReportedMismatch`, covering the node and its reported descendants;
- `reportedChildTotals`, immediate-child sums aligned with reporting months, or `null` for a leaf;
- `unavailableChannels`, explicit null-valued rows for display, separate from reported channel records.

The server validates its source fixture with `server/client-source.ts`, derives chart and discrepancy data in `server/clients.ts`, and validates the final response using the same parser as the browser. Boundary validation rejects invalid reporting months, duplicate IDs (including unavailable rows), wrong nesting or kinds, invalid names, unsafe or fractional counts, mismatched array lengths, missing chart metadata, malformed unavailable rows, and invalid avatar URLs. A malformed response produces an error state; the frontend never substitutes fabricated business data.

Employee portrait URLs are stored in `server/clients.json`, and the image files live under `server/avatars`. The backend serves them at `/avatars/...` in development and production. The frontend uses the supplied URL directly, independently of employee IDs and names; null or failed images fall back to initials. No separate users endpoint is needed.

The page owns loading/error/ready presentation and composes the chart, hierarchy table, and conditional reset action. `useClients` owns fetching, cancellation, validation, and retry for the client request. `useClientChart` owns row selection, channel visibility, and chart reset; `useClientHierarchy` owns expansion and visible rows. The frontend only formats API months and adapts API chart rows for rendering. Colors, sorting, date formatting, initials, axis ticks, pixel geometry, animations, and the sum of visible stack segments are presentation concerns. Channel aggregation, numeric balances/excesses, reconciliation flags, and unavailable-row creation stay on the backend. Presentation components receive data and callbacks rather than fetch independently.

No router is needed for one addressable screen. No TanStack Query or global state store is needed for one read-only request and local interactions. Add TanStack Query when screens share cached server data or need mutations and refetch rules. React Router is the recorded option for additional screens and shareable navigation state. Neither is installed today. Routing and query caching solve separate problems and can be added independently.

React and TypeScript fit the component and API contracts. Vite provides development middleware and a production build without a server-rendering framework. SCSS Modules keep component styles scoped, while CSS custom properties share design tokens. The choice also followed the public Nevis sign-in page and loaded assets inspected on 2026-10-26. That inspection informed the stack; it did not establish access to authenticated screens or Nevis's source repository.

The assignment needs a small set of controls, so it uses local components rather than a large UI kit. Plain TypeScript validates this single API contract without another schema dependency. A schema library could become useful if contracts multiply; general collection utilities would not replace the domain rules for hierarchy shape, months and counts.

## 1.2. Why calculations stay on the backend

The server computes channel aggregates, missing balances, and discrepancies; the browser presents those results. This gives every consumer the same interpretation of incomplete data and keeps business calculations separate from chart rendering.

At the current size, frontend derivation would also be practical. Keeping calculations on the backend is a choice about ownership and future completeness, rather than a claim that the browser cannot process twelve nodes. It adds derived fields to the API and means changing calculation rules can require coordinated backend and frontend changes.

The benefit becomes more important with pagination, cursors, and lazy loading. A browser displaying one page of employees cannot calculate a complete branch chart from those employees alone. The backend can return a summary of the whole selected branch independently of which detail pages have been fetched. Expanding a row or fetching another page then changes the detail available to inspect, without changing the meaning of the chart. The [scaling plan](loading-and-scaling.md) describes how to fetch and prepare only the summaries and detail actually requested.

## 1.3. Why the chart uses native elements

For one chart with twelve monthly stacked bars, React and HTML/CSS are enough to render the values, legend, tooltips, and transitions. Keeping this small implementation avoids adding a charting dependency for a narrow requirement. The cost is that we own scale calculation, positioning, keyboard behavior, and maintenance ourselves.

For a production dashboard with more chart types, interactions, or demanding rendering requirements, we would move to an established library. **Recharts is the first option to evaluate for this React application:** its declarative React components and SVG rendering fit the current component model. **Chart.js is an alternative** when a canvas renderer better fits measured rendering needs. These are alternatives to assess against the product's requirements, rather than a single universal standard. See the [Recharts project documentation](https://github.com/recharts/recharts) and [Chart.js performance guidance](https://www.chartjs.org/docs/latest/general/performance.html). A migration would still need to preserve our data semantics and keyboard access; [Chart.js documents the text alternatives required for its canvas output](https://www.chartjs.org/docs/latest/general/accessibility.html).

A larger employee dataset alone does not require a different renderer: a backend summary can still produce twelve monthly bars. The decision should follow chart complexity, maintenance cost, and measured performance.

## 1.4. Why there is a filter button beside each row

The row filter makes chart drill-down explicit at the point where someone is inspecting a company, branch, advisor, or channel. It avoids a separate selector that repeats the hierarchy. It also keeps two different intentions separate: expanding a name reveals table details, while the filter button chooses whose figures the chart shows. A reviewer can compare levels without changing the table's expansion state or losing their place.

The funnel button has an explanatory tooltip, appears on hover or keyboard focus, and remains visible on touch devices. Rows whose channel values are unavailable have no filter action. Reset returns the chart to the company view with every series visible.

Hierarchy expansion renders the visible rows directly. Names wrap and table rows grow naturally, with reduced indentation on narrow layouts. There is no separate exiting-row copy or animation timer to synchronize. Chart transitions and the disclosure arrow retain their small CSS animations. Reconciliation uses a native inline `details` disclosure, avoiding custom dismissal state, global Escape listeners, or an overlay that could cover table controls. The chart tooltip positioning and page-following table header remain because they serve existing interactions.

## 1.5. API and application server

One Express application handles `/api/clients` and serves the app on port 5180. `server/api.ts` owns the API router; `server/index.ts` mounts it, serves portraits and production assets with `express.static`, and handles errors. Development uses `tsx watch` to restart on backend code, imported shared modules, and JSON fixture changes, alongside Vite middleware and frontend HMR on the same HTTP server. Vite loads only in development. Production runs the compiled `build/server/index.js` with Node and serves the frontend's `dist` files; the backend build also copies its source JSON and portraits under `build/server`. Source JSON is read and validated at startup, enriched into the API contract, and held in memory; original reported values are preserved. Production requires a rebuild and restart after editing the fixture. Avatar serving is separate from the frontend build, including correct 404 responses for missing images. Unknown API endpoints return JSON 404 responses, unsupported methods return 405, and static middleware constrains files to their configured directories. `/healthz` confirms that startup completed. `HOST` and `PORT` configure the listener; containers bind to `0.0.0.0`.

The first version used Node's built-in `node:http` module to avoid a framework dependency. As routing, static assets, MIME handling, and error responses accumulated, that choice left us maintaining HTTP boilerplate unrelated to the assignment. Express fits better because its routes and static middleware replace that custom plumbing with familiar conventions. Node still creates the underlying HTTP server; Express handles routing and middleware. Data validation and enrichment remain independent of the HTTP framework.

Compose provides development with mounted source and isolated dependencies. The production Dockerfile packages the compiled application and production dependencies, runs as a non-root user, and includes an HTTP health check. The demo has no authentication, database, or writes; public deployments should serve the supplied demo dataset only.

## 1.6. Accessibility

The hierarchy remains a native table with column and row headers. Disclosure buttons expose accessible names and `aria-expanded`; row-header text describes depth and ancestors. Enter and Space use native button behavior. Arrow keys and Home/End navigate disclosures. Sparse branches have no inert expander. Expanding a row preserves monthly alignment.

Chart buttons expose scope, month, totals, series values, and excess values in their accessible names. Tooltips work with mouse, keyboard, and tap. Scroll containers have labels, visible focus is retained, and reduced-motion preferences are respected.

Automated Chromium checks and visual browser inspection are useful evidence; VoiceOver/NVDA and Firefox/Safari remain follow-up verification.

## 1.7. Repository layout and workspaces

The application uses one private npm package with source-level separation:

```text
src/       React UI, presentation hooks and styles
server/    Express API, source validation and data preparation
shared/    API contract, runtime response validation and demo definitions
e2e/       Browser and API checks
```

The frontend and backend have separate build outputs (`dist/` and `build/`) but ship together. Express hosts Vite middleware during development and serves the built frontend in production. One root manifest, lockfile and set of commands match that lifecycle. Keeping this layout avoids introducing package entry points, local package dependencies and build coordination for one screen and its API.

The cost is that frontend and backend dependencies share a manifest. The production image installs that combined runtime dependency set, including React even though Node only serves its built assets. Shared modules are imported by relative path, and package manifests do not enforce which layer may depend on which. The directories communicate ownership, but they do not provide package-level dependency boundaries.

Workspaces would be useful if the API and frontend needed separate dependency sets or deployments, another application consumed the shared contract, or dependency boundaries became harder to maintain. A possible layout is `apps/web`, `apps/server` and `packages/contracts`, with explicit exports and build order for the shared package. Workspaces can also retain a single deployment; separate deployment is one possible reason to adopt them, rather than a prerequisite.

Choosing workspaces and choosing pnpm are separate decisions: both [npm](https://docs.npmjs.com/cli/v11/using-npm/workspaces/) and [pnpm](https://pnpm.io/workspaces) support multiple local packages. npm already supports the current install, CI and Docker flow. For this take-home, the benefits of changing package management and introducing workspaces do not yet justify migrating those paths. Revisit that choice when a concrete package boundary needs it.
