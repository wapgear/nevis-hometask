# Nevis client dashboard

[Live demo](https://nevis.izmailov.dev) · [Implementation notes](docs/implementation/README.md)

A React and TypeScript dashboard with a monthly stacked chart and an expandable company → branch → advisor → acquisition-channel table. A Node.js REST API serves the data. Row controls select the chart scope; legend buttons filter channels. Keyboard controls, loading/error/empty states, and narrow layouts are supported.

## Run

Use Node.js 24 LTS and npm (`nvm use` if available). No credentials or environment file are needed.

```sh
npm ci
npm run dev
```

Open [localhost:5180](http://127.0.0.1:5180). Set `PORT` if needed. To try the production build, stop development, then run `npm run build && npm start`.

For Docker, deployment, and rollback instructions, see [Development and deployment](docs/implementation/running-and-deployment.md).

## Test

```sh
npx playwright install --with-deps chromium
npm run check
```

This runs lint, TypeScript, the production build, and Playwright checks for hierarchy expansion, chart values and geometry, API failures, keyboard access, accessibility scans, and narrow layouts. Run `npm run test:a11y` for accessibility checks alone. Manual screen-reader and Safari/Firefox checks remain follow-up work.

Click **Demo mode** to try healthy, slow, unavailable, empty, and malformed API responses. Select Healthy or turn Demo mode off to recover. See [Testing and Demo mode](docs/implementation/testing-and-demo.md) for details.

## Assumptions and open questions

The [Figma design](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781) guides the layout. The assignment's 12 nodes and monthly figures are preserved in [server/clients.json](server/clients.json), covering February 2024 to January 2025.

Only Anna Blackwood has channel data, and some parent totals disagree with their children. Missing breakdowns appear as dashes in the table. The chart's hatched **Unknown channel** balance includes missing coverage and unreconciled differences; excess channel figures are preserved and explained. This intentionally differs from the reference chart rather than inventing allocations. See [Data sources and caveats](docs/implementation/data-caveats.md) for the rules.

Questions for the data owner: which totals should win when figures disagree, does an omitted breakdown mean unknown, and are monthly figures snapshots or flows? This demo treats them as client counts and derives no growth rates.

## What I would do next

Validate those data rules, then manually check screen readers and other browsers. The current screen uses local React hooks, native HTML/CSS bars, SCSS Modules, and Express. Larger datasets would need complete chart summaries separate from paginated detail, with lazy loading and virtualization added when measurements justify them. Shared server state or more complex charts may justify TanStack Query or a chart library. See [Architecture](docs/implementation/architecture.md) and [Loading and scaling](docs/implementation/loading-and-scaling.md) for the trade-offs.
