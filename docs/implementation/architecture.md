# Architecture and dependency choices

## Frontend

React and TypeScript render one Clients page. Vite builds the application, SCSS Modules scope page/component styling, and CSS custom properties hold the small set of shared visual tokens. Inter is bundled locally. The warm surface, compact table, restrained controls, and chart colors follow the reference design.

`shared/clients.ts` defines and validates the API contract, channel vocabulary, and child traversal. `/api/clients` returns `{ months, data }`: ordered unique reporting months in `YYYY-MM` format and the company hierarchy (or `data: null`). Each node supplies:

- `id`, `name`, `kind`, and the original `values` aligned with `months`;
- `avatarUrl`, an explicit URL or `null`;
- `chart`, one row per month containing `known` channel counts in the shared channel order, `missing` balance, and `excess` over the reported total;
- `hasReportedMismatch`, covering the node and its reported descendants;
- `unavailableChannels`, explicit null-valued rows for display, separate from reported channel records.

The server validates its source fixture with `server/client-source.ts`, derives chart and discrepancy data in `server/clients.ts`, and validates the final response using the same parser as the browser. Boundary validation rejects invalid reporting months, duplicate IDs (including unavailable rows), wrong nesting or kinds, invalid names, unsafe or fractional counts, mismatched array lengths, missing chart metadata, malformed unavailable rows, and invalid avatar URLs. A malformed response produces an error state; the frontend never substitutes fabricated business data.

Employee portrait URLs are stored in `server/clients.json`, and the image files live under `server/avatars`. The backend serves them at `/avatars/...` in development and production. The frontend uses the supplied URL directly, independently of employee IDs and names; null or failed images fall back to initials. No separate users endpoint is needed.

The page owns loading/error/ready presentation and composes the chart, hierarchy table, and conditional reset action. `useClients` owns fetching, cancellation, validation, and retry for the client request. `useClientChart` owns row selection, channel visibility, and chart reset; `useClientHierarchy` owns expansion and visible rows. The frontend only formats API months and adapts API chart rows for rendering. Colors, sorting, date formatting, initials, axis ticks, pixel geometry, animations, and the sum of visible stack segments are presentation concerns. Channel aggregation, numeric balances/excesses, reconciliation flags, and unavailable-row creation stay on the backend. Presentation components receive data and callbacks rather than fetch independently.

No router is needed for one addressable screen. No TanStack Query or global state store is needed for one read-only request and local interactions. These become useful when several screens share data, freshness rules, mutations, or navigation state. A charting library is also unnecessary for twelve stacked bars: semantic buttons, flex layout, labels, and an equivalent text table cover the current interaction without another runtime dependency.

## API and application server

One Express application handles `/api/clients` and serves the app on port 5180. `server/api.ts` owns the API router; `server/index.ts` mounts it, serves portraits and production assets with `express.static`, and handles errors. Development uses `tsx watch` to restart on backend code, imported shared modules, and JSON fixture changes, alongside Vite middleware and frontend HMR on the same HTTP server. Production preview serves the built `dist` files. Source JSON is read and validated at startup, enriched into the API contract, and held in memory; original reported values are preserved. Production requires a restart after editing the fixture. Avatar serving is separate from the frontend build, including correct 404 responses for missing images. Unknown API endpoints return JSON 404 responses, unsupported methods return 405, and static middleware constrains files to their configured directories.

Express replaces custom HTTP dispatch, MIME mapping, and file-serving code with standard routing and middleware. Data validation and enrichment remain independent of the HTTP framework. The demo is a local preview, with no authentication, database, writes, or claim to be a production deployment platform.

## Accessibility

The hierarchy remains a native table with column and row headers. Disclosure buttons expose accessible names and `aria-expanded`; row-header text describes depth and ancestors. Enter and Space use native button behavior. Arrow keys and Home/End navigate disclosures. Sparse branches have no inert expander. Expanding a row preserves monthly alignment.

Chart buttons expose scope, month, totals, series values, and excess values in their accessible names. Tooltips work with mouse, keyboard, and tap. Scroll containers have labels, visible focus is retained, and reduced-motion preferences are respected.

Automated Chromium checks and visual browser inspection are useful evidence; VoiceOver/NVDA and Firefox/Safari remain follow-up verification.
