# This README is for humans

Agents can go directly to [/docs](docs/README.md) for the reasoning behind the architecture and product decisions.

# Nevis client dashboard

[Live demo](https://nevis.izmailov.dev) · [Documentation](docs/implementation/README.md)

When I review take-home assignments, spending time on local setup is a pain, even when agents handle most of it. So I deployed this one. The live demo runs the latest commit from `main` that has passed checks and deployment, so you can try it without running anything on your machine. Open [github.dev](https://vscode.dev/github/wapgear/nevis-hometask) to review the code in a browser editor, too.

I built this dashboard for advisors and their managers to review monthly client counts across the company, branches, advisors and acquisition channels. It uses React, TypeScript, Vite and SCSS Modules, with an Express REST API.

The monthly stacked chart shows changes over time, and the expandable table gives exact figures. Each row's funnel button selects its chart scope. Legend buttons filter channels, and Reset chart restores the company view. The UI supports keyboard controls, narrow layouts and reduced motion.

## Data and assumptions

The assignment PDF supplied the 12 reported nodes in [server/clients.json](server/clients.json), covering February 2024 to January 2025. The [Figma design](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781) guided the layout; Nevis's public sign-in page and assets informed the stack and styling.

Only Anna Blackwood has channel data, and some parent totals disagree with their children. I kept the supplied figures. Missing breakdowns appear as dashes in the table; the chart's hatched Unknown channel balance includes missing coverage and unreconciled differences. Excess channel values stay visible and have an explanation.

We still need to confirm which totals should win, what omitted channels mean, and whether monthly figures are snapshots or flows. The demo calculates no growth rates. See [data caveats](docs/implementation/data-caveats.md) and [users and purpose](docs/implementation/users-and-purpose.md).

## Run locally

Use Node.js 24 and npm. `nvm use` selects the pinned Node version. The app needs no credentials, environment file or database.

```sh
npm ci
npm run dev
```

Open [localhost:5180](http://127.0.0.1:5180). Frontend changes hot-reload; backend and fixture changes restart the server. Set `PORT` if needed.

To try a production build, stop development first, then run:

```sh
npm run build
npm start
```

## Run with Docker

For development, start Docker Engine and run:

```sh
docker compose up
```

Open the same local URL. Compose provides live updates and installs its own dependencies. Stop with `docker compose down`; run `docker compose restart app` after dependency changes.

To build and run the production image locally:

```sh
docker build -t nevis-dashboard:local .
docker run -d --name nevis-dashboard --restart unless-stopped \
  -p 127.0.0.1:5180:5180 nevis-dashboard:local
```

Free port 5180 first. The image runs as a non-root user and checks `/healthz`.

## Demo mode

Click Demo mode or open [the demo controls](https://nevis.izmailov.dev/?demo). Locally, use `/?demo`. The selector changes the scenario; Reload data repeats it.

| Scenario | What happens | What to check |
| --- | --- | --- |
| Healthy | Returns the fixture. | Explore rows, chart filters, tooltips and discrepancies. Select this to recover. |
| Slow, 3 seconds | Delays the response. | Inspect loading and switch scenarios to check cancellation. |
| Unavailable, 503 | Returns a server error. | Check the error and Try again. Retry keeps this scenario. |
| Empty data | Returns no clients. | Check the dedicated empty state. |
| Malformed data | Returns HTTP 200 with invalid data. | Check that validation shows an error. |

Scenarios persist in the URL and affect only that tab's requests. Turn Demo mode off to restore normal data. See [the demo guide](docs/implementation/testing-and-demo.md).

## Deploy to production

The [GitHub Actions workflow](.github/workflows/deploy.yml) deploys to [nevis.izmailov.dev](https://nevis.izmailov.dev), a VPS behind Caddy:

1. Pull requests run lint, build/type checks and Playwright against the production ARM64 container.
2. A verified push to `main` publishes to `ghcr.io/wapgear/nevis-hometask` and deploys the image digest over restricted SSH.
3. The script updates the `nevis` Compose project, restoring the previous image if container health fails and a previous release exists. Actions then checks public HTTPS health.

Run workflow on `main` retries a release. Server provisioning, required secrets, logs and rollback commands are in [development and deployment](docs/implementation/running-and-deployment.md).

## Why I kept it simple

I kept the implementation small for one screen with at most 24 visible table rows. Local React hooks handle one fetch; the backend validates the fixture and prepares chart figures at startup.

The repository also stays as one npm package: `src/` contains the web UI, `server/` contains the API and data preparation, and `shared/` contains the API contract and demo definitions. Express serves both the API and frontend, so one install, development command and production image fit the current scope. Separate web/server workspaces would give each package its own dependencies, but would also need package entry points and build coordination. The trade-off today is a shared dependency manifest and relative imports into `shared/`. I would revisit workspaces for another consumer of the shared contract, separate deployment needs, or stronger dependency boundaries; see the [repository layout decision](docs/implementation/architecture.md#17-repository-layout-and-workspaces).

I would add the changes below as the product grows. None is implemented today.

| Area | Current choice | When I would change it |
| --- | --- | --- |
| Charts | Native HTML/CSS bars. | Evaluate Recharts for more chart types or interactions; consider Chart.js if measurements favor canvas. |
| Server state | A fetch hook handles validation, cancellation and retry. | Add TanStack Query for shared caching, mutations and refetch rules. |
| Routing | One screen, no router. | Add React Router for more screens or shareable navigation state. |
| Pagination and partial loads | One response contains the whole tree. | Return complete chart summaries separately from cursor-paginated children. Loading another table page must not change chart totals. |
| Lazy data loading | Expansion uses the initial response. | Fetch children on expansion and summaries on selection when full-tree loading becomes costly. |
| Summary preparation | Prepare every node at startup. | Calculate on demand; cache or precompute expensive scopes with freshness rules. |
| Live updates | A static fixture. | Update affected summaries and refetch views, keeping chart and table revisions consistent. |
| Virtualization | Render all visible rows. | Virtualize if hundreds or thousands of visible rows slow scrolling. Preserve keyboard focus and hierarchy semantics. |
| Code splitting | Load the current screen together. | Lazy-load substantial, infrequently visited routes when they exist. |

The [architecture notes](docs/implementation/architecture.md) and [scaling plan](docs/implementation/loading-and-scaling.md) explain the trade-offs.

## Test

After `npm ci`, install Chromium and run the checks:

```sh
npx playwright install --with-deps chromium
npm run check
```

This runs lint, TypeScript, the production build and Playwright checks for chart/table behavior, API contracts, response states, keyboard access, accessibility scans and narrow layouts. Run `npm run test:a11y` for the accessibility suite alone.

Next, I would confirm the data rules and manually test VoiceOver/NVDA and Safari/Firefox. Automated Chromium checks do not establish screen-reader compatibility.
