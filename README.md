# Nevis client dashboard

A React and TypeScript demo showing client counts from February 2024 to January 2025. An Express REST API supplies the company → branch → advisor → acquisition-channel hierarchy.

## Run

Requires Node.js 22.12+ and npm. No credentials, environment file, or database is needed.

```sh
npm ci
npm run dev
```

Development automatically restarts the server when backend code, imported shared modules, or `server/**/*.json` fixtures change. Vite continues to hot-reload frontend changes.

Open [the dashboard on port 5180](http://127.0.0.1:5180). One process serves the application and `GET /api/clients`. The response contains `{ months, data }`: ordered `YYYY-MM` reporting months and the company hierarchy. Each node’s values and chart rows align with those months; `data: null` represents an empty dataset. The API supplies node kinds, avatar URLs, chart channel aggregates, remaining balances, discrepancy flags, and unavailable-channel rows. Employee portraits are stored under `server/avatars` and served by the backend; the browser uses the supplied `avatarUrl` or renders initials when it is null or fails to load. Stop it with Ctrl+C. For a production preview, stop development first, then:

```sh
npm run build
npm start
```

Production preview also uses port **5180**. `PORT` can override it; an occupied port fails explicitly.

## Use

- Company starts expanded. Click a disclosure or row to reveal its children. Enter and Space toggle focused disclosures; Up/Down and Home/End move between available disclosure buttons.
- Advisors without supplied channels expand to Existing clients, New organic, and New paid rows with **-** in every month. The API supplies these explicit null-valued rows separately from reported channels; they do not change totals or chart scopes.
- Hover a table row to reveal the chart icon beside its name, then click it to show that row’s monthly figures. The icon also appears on keyboard focus and stays visible on touch screens. Rows with unavailable channel figures have no chart action. Selection preserves table expansion. Hover, focus, or tap a bar for the monthly figures; Escape dismisses its tooltip. **Reset chart** appears at the top right after selecting another row or hiding a channel, and restores the company view with all channels shown.
- Click a chart legend item to show or hide that channel. Hidden channels stay in the legend, dimmed and struck through. Bars and scale numbers animate to the visible values, respecting reduced-motion preferences. The hierarchy table keeps the full supplied figures.
- Narrow layouts scroll within the chart and hierarchy table, with the table labels pinned in place.
- Failed requests show **Try again**. Empty and malformed responses have distinct handling.

For demonstrations, click **Demo mode** at the top right beside **Reset chart**, or open [the dashboard with demo controls](http://127.0.0.1:5180/?demo). A floating panel lets you select **Healthy**, **Slow (3 seconds)**, **Unavailable (503)**, **Empty data**, or **Malformed data**, and reload the current scenario. Changing the selection immediately refetches data and saves the scenario in the URL (for example, `?demo=slow`). Retry keeps the selected scenario; choose **Healthy** to recover. Click **Demo mode** again to hide the controls, remove the URL flag, and restore normal server behavior. Simulation applies only to that request, so other tabs keep their own server behavior. These controls work in development and production preview.

## Verify

Install Chromium once, then run the checks:

```sh
npx playwright install chromium
npm run check
```

`check` runs ESLint, TypeScript, the production build, and Playwright browser checks. The tests cover API figures, keyboard expansion/collapse and navigation, all 12 chart scopes across all 12 months, rendered bar heights and stack positions, tooltip dismissal, loading, error/retry, and layout containment at 375px. Shared browser locators and actions live in `e2e/pages/dashboard.page.ts`, supplied through the `dashboard` fixture in `e2e/fixtures.ts`; assertions and scenario-specific API mocks stay in the specs. Expected assignment figures live in `e2e/data/assignment.ts` as an independent transcription, so accidental changes to the server dataset fail the checks. Contract checks also verify that the browser uses API chart figures, unavailable rows, and avatar URLs, and rejects malformed metadata. HTTP checks cover GET/HEAD responses, cache headers, unsupported methods, unknown API routes, missing portraits, and traversal rejection.

Accessibility checks run with `npm run test:a11y`. They combine axe scans for WCAG 2.2 A/AA rules with keyboard navigation, focus recovery, accessibility-tree semantics, 320px reflow (including a 200px-high viewport), simulated 200% text enlargement and text spacing, forced colors, and reduced motion. Scans cover the initial and expanded hierarchy, unavailable channels, hidden legend series, chart tooltip/discrepancy, mobile demo, loading, error, and empty states. Full axe results, including findings that need manual review, are attached to the tests. Run `npm run test:a11y -- --reporter=list,html` to generate a browsable report with screenshots and the accessibility-tree capture.

These checks exercise Chromium; they do not certify WCAG compliance or replace testing with assistive technology. Before claiming screen-reader compatibility, verify with VoiceOver/Safari on macOS and NVDA/Chrome on Windows that table row/month headers, unavailable values, chart figures, expanded and selected states, loading/errors, and focus after retry/reset/dismissal are announced correctly. Also verify real browser zoom at 200% and 400%, and target acquisition with the user's switch or voice-control setup. See [Playwright's accessibility-testing guidance](https://playwright.dev/docs/accessibility-testing) and [W3C's focus visibility guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).

## Assumptions and open questions

The PDF payload is authoritative when it differs from Figma. Parent totals and child totals do not always reconcile, and only Anna Blackwood has channel data. The dashboard preserves all supplied values. Hatched gray is the remainder without a supplied channel breakdown. If known channels exceed a reported total, the bar preserves the channel values and the discrepancy appears beside the chart and in its tooltip/data table.

The design's predominantly purple company-wide bars cannot be derived from this payload without assuming missing channel data. We keep its composition, typography, and colors, and explicitly show the missing breakdown. Row chart actions make chart drill-down available at every reported level.

Next: confirm a reconciliation rule and complete channel data; test with VoiceOver/NVDA and Firefox/Safari; add incremental fetching or virtualization when actual scale warrants them. The implementation deliberately has one screen and a read-only API.

See [implementation notes](docs/implementation/README.md) for the architecture, data caveats, and scaling decisions.
