# Nevis client dashboard

A React and TypeScript demo showing client counts from February 2024 to January 2025. An Express REST API supplies the company → branch → advisor → acquisition-channel hierarchy.

## Run

Requires Node.js 22.12+ and npm. No credentials, environment file, or database is needed.

```sh
npm ci
npm run dev
```

Development automatically restarts the server when backend code, imported shared modules, or `server/**/*.json` fixtures change. Vite continues to hot-reload frontend changes.

Open [the dashboard on port 5180](http://127.0.0.1:5180). One process serves the application and `GET /api/clients`. The response contains `{ months, data }`: ordered `YYYY-MM` reporting months and the company hierarchy. Each node’s values and chart rows align with those months; `data: null` represents an empty dataset. The API supplies node kinds, avatar URLs, chart channel aggregates, remaining balances, discrepancy flags, and unavailable-channel rows. Employee portraits are stored under `server/avatars` and served by the backend; the browser uses the supplied `avatarUrl` or renders initials when it is null or fails to load. Stop it with Ctrl+C. To run the production build, stop development first, then:

```sh
npm run build
npm start
```

The build writes frontend assets to `dist/` and compiled backend code, the dataset, and portraits to `build/`. Production runs with Node directly, without Vite or `tsx`. Both modes use port **5180** by default. `PORT` can override it; an occupied port fails explicitly. `HOST` defaults to `127.0.0.1`; containers set it to `0.0.0.0`. `GET /healthz` returns `{ "status": "ok" }` once the dataset has loaded and the server accepts requests.

## Docker

### Development

With Docker Engine and Docker Compose running:

```sh
docker compose up
```

Open [the dashboard on port 5180](http://127.0.0.1:5180). Compose mounts the source for frontend hot reload and backend/fixture restarts, and enables polling for Docker Desktop file changes. A named volume keeps container dependencies separate from the host's `node_modules`. Dependencies install from the lockfile on each start; after changing dependencies, run `docker compose restart app`. No host Node installation is needed. To use another host port, run `PORT=5181 docker compose up`; the container still listens on 5180.

Stop with Ctrl+C or `docker compose down`. To remove the dependency volume as well, use `docker compose down --volumes`.

### Production

```sh
docker build -t nevis-dashboard:local .
docker run -d --name nevis-dashboard --restart unless-stopped \
  -p 127.0.0.1:5180:5180 nevis-dashboard:local
```

The multi-stage image includes production dependencies, compiled code, and application assets, and runs as a non-root user. It serves the dashboard, API, and portraits from one process and checks `/healthz` for readiness. There are no required volumes or secrets. Set `PORT` with `-e PORT=8080` and map the same container port if your host requires a different one. Run development and production separately, or map production to a different host port.

On a server, put an HTTPS reverse proxy in front of `127.0.0.1:5180`. The loopback port binding keeps the application reachable through that proxy; if the proxy runs in another container, connect both containers over a Docker network instead. Tag deployment images with a release or Git commit so a previous image can be restarted for rollback. `docker logs nevis-dashboard` shows application logs. The restart policy handles process exits; an unhealthy status alone does not restart a standalone Docker container.

### Deployment to nevis.izmailov.dev

GitHub Actions verifies the production ARM64 image with lint, build/type checks, and the browser/HTTP suite. Successful pushes to `main` publish a commit-tagged image to `ghcr.io/wapgear/nevis-hometask` and deploy its immutable digest to the existing VPS. Pull requests verify the image without deploying; **Run workflow** on `main` retries a deployment.

The server runs `compose.production.yaml` from `/home/deploy/nevis-hometask` as the **nevis** Compose project, with a 256 MiB memory limit, half a CPU, and a read-only filesystem. Its only shared infrastructure is Caddy's existing `personal-api_default` Docker network. The unique `nevis-dashboard` alias lets Caddy route traffic without exposing another host port. The API and database containers are never included in Nevis deploy commands.

Repository variables are `VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT`, and `VPS_KNOWN_HOSTS`. `VPS_SSH_KEY` is a dedicated repository secret; its authorized key is restricted to the server-owned `deploy/deploy.sh` command, with no shell or forwarding access. Each deployment uses a temporary Docker login configuration and removes it afterward, leaving other deployments' registry credentials alone. A deployment lock serializes releases, and a failed container health check restores the previous image.

One-time server provisioning installs `compose.production.yaml` and `deploy/deploy.sh` in the deployment directory. Changes to those server-owned files require an operator to sync them; ordinary app releases need only a push to `main`. The Caddy block in `deploy/Caddyfile.nevis` is installed in the existing proxy configuration and mirrored in `personal-api/docker/Caddyfile` so later API deployments preserve the route. Caddy validates and reloads its configuration without restarting the API or database.

To inspect a release on the VPS:

```sh
cd /home/deploy/nevis-hometask
docker compose --project-name nevis --env-file .env -f compose.production.yaml ps
docker compose --project-name nevis --env-file .env -f compose.production.yaml logs --tail 100
```

For manual rollback, set `NEVIS_IMAGE` to the digest in `.env.previous`, then run the same scoped Compose command with `up -d --wait`. Successful releases retain the previous digest in `.env.previous`. No Nevis operation prunes shared Docker images or runs commands against the personal-api Compose project.

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
