# 5. Testing and Demo mode

## 5.1. Open the controls

Click Demo mode at the top of the page, or open `/?demo` on the local or deployed app. The floating panel has a Server state selector and Reload data button. Selecting a scenario immediately refetches it. The URL retains the selection across reloads.

| Scenario | URL | API behavior | What to check |
| --- | --- | --- | --- |
| Healthy | `/?demo=normal` | Returns the original fixture. | Inspect expansion, chart selection, legend filters, tooltips and discrepancies. Select this to recover from another scenario. |
| Slow, 3 seconds | `/?demo=slow` | Waits three seconds before returning the fixture. | Inspect loading, then switch scenarios before completion to check cancellation. |
| Unavailable, 503 | `/?demo=dead` | Returns HTTP 503, including on retry. | Inspect the error and Try again control. Retry preserves the scenario. |
| Empty data | `/?demo=empty` | Returns `{ months: [], data: null }`. | Inspect the dedicated empty state. |
| Malformed data | `/?demo=malformed` | Returns HTTP 200 with `{ months: [], data: {} }`. | Confirm validation produces an error instead of rendering invalid figures. |

## 5.2. Request lifecycle and isolation

Reload data repeats the selected request. Turning Demo mode off removes its query parameter and fetches normal data. Simulation applies per API request, so choosing a scenario does not change other tabs or global server state. The fetch hook aborts obsolete requests and checks cancellation before applying a response. The same controls work in development and the production image.

The server's scenario definitions live in [shared/demo.ts](../../shared/demo.ts), the responses in [server/api.ts](../../server/api.ts), and URL state in [useDemoScenario.ts](../../src/pages/Clients/hooks/useDemoScenario.ts). Demo mode simulates response conditions; it does not change the fixture or generate live client updates.

## 5.3. Run verification

After installing dependencies with `npm ci`:

```sh
npx playwright install --with-deps chromium
npm run check
```

The install command downloads Chromium and installs its required Linux system libraries. Installing system libraries may require sudo on Linux.

`check` runs ESLint, TypeScript, the production build and Playwright. To run the accessibility suite alone, use `npm run test:a11y`. To create its HTML report, use `npm run test:a11y -- --reporter=list,html`.

Playwright starts development on port 5180. Outside CI it can reuse a server already listening there; CI verifies against the production container started by the workflow. Do not treat a run against an unrelated process on that port as verification of the current checkout.

## 5.4. Coverage and test structure

| Suite | Coverage |
| --- | --- |
| [Dashboard](../../e2e/dashboard.spec.ts) | Assignment values, reporting months, response validation, avatars, unavailable rows, hierarchy and chart state, bar geometry, tooltips, errors and narrow layouts. |
| [Demo](../../e2e/demo.spec.ts) | URL persistence, retry, recovery, delayed requests, tab isolation, cancellation and keyboard controls. |
| [HTTP](../../e2e/server.spec.ts) | Readiness, read-only methods, GET/HEAD, cache headers, missing API routes and portraits, and traversal rejection. |
| [Accessibility](../../e2e/accessibility.spec.ts) | Axe scans, table semantics, accessible names, keyboard navigation, focus recovery, reflow, doubled text, text spacing, forced colors and reduced motion. |

The [page object](../../e2e/pages/dashboard.page.ts) holds shared locators and actions; specs keep assertions and scenario-specific mocks. [Expected assignment figures](../../e2e/data/assignment.ts) are an independent transcription, so a mistaken fixture edit cannot change both actual and expected values together. Geometry checks verify rendered bars and stacks rather than relying only on implementation attributes.

## 5.5. Limits and manual follow-up

The configured browser is Chromium. Automated scans and accessibility-tree captures do not establish complete WCAG compliance or verified screen-reader compatibility. Check VoiceOver/Safari and NVDA/Chrome for table headers, hierarchy depth, unavailable values, selected scopes, loading/errors and focus after reset, retry and dismissal. Also check Firefox/Safari, real browser zoom at 200% and 400%, and the intended switch or voice-control setup. Simulated text enlargement and a 320px viewport cover useful cases but do not replace those checks.

This documentation audit checked source and test coverage; it did not rerun application tests or verify a live production release.
