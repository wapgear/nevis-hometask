# 6. Development and deployment

## 6.1. Run locally

Use Node.js 24 LTS and npm (`nvm use` selects the version in `.nvmrc`). The app needs no credentials, environment file or database.

```sh
npm ci
npm run dev
```

Open [localhost:5180](http://127.0.0.1:5180). One Express server handles Vite middleware, `/api/clients` and portraits. Frontend changes hot-reload; `tsx watch` restarts for backend code, imported shared modules and JSON fixture changes. `HOST` defaults to `127.0.0.1`; `PORT` defaults to `5180`. An occupied port fails rather than silently selecting another one.

Stop development before running a production build on the same port:

```sh
npm run build
npm start
```

The build writes frontend files to `dist/` and compiled backend code, fixture and portraits to `build/`. Production uses Node directly and loads the fixture at startup. Fixture edits require a rebuild and restart. `/healthz` reports readiness after startup.

## 6.2. Run through Docker

For development with Docker Engine and Compose:

```sh
docker compose up
```

[compose.yaml](../../compose.yaml) mounts source and keeps container dependencies in a named volume. It installs dependencies from the lockfile at startup and uses polling for file changes. Restart with `docker compose restart app` after dependency edits. Use `PORT=5181 docker compose up` to change the host port. Stop with Ctrl+C or `docker compose down`; adding `--volumes` also removes the dependency volume.

To run the production image locally:

```sh
docker build -t nevis-dashboard:local .
docker run -d --name nevis-dashboard --restart unless-stopped \
  -p 127.0.0.1:5180:5180 nevis-dashboard:local
```

The [Dockerfile](../../Dockerfile) packages compiled assets and production dependencies, runs as a non-root user and checks `/healthz`. Containers bind to `0.0.0.0` internally; the local mapping exposes port 5180 on loopback. Use `docker logs nevis-dashboard` to inspect it. The restart policy handles process exits; an unhealthy status alone does not restart a standalone container.

## 6.3. Release to nevis.izmailov.dev

The [GitHub Actions workflow](../../.github/workflows/deploy.yml) defines the release:

1. Pull requests and pushes to `main` run lint, build/type checks and Playwright browser/HTTP checks against the ARM64 production container, with the deployment's resource and filesystem restrictions.
2. A successful `main` run publishes `ghcr.io/wapgear/nevis-hometask:sha-<commit>` and passes the image's immutable digest to deployment. Pull requests do not publish or deploy.
3. Actions sends the digest and temporary registry credentials over restricted SSH to the server-owned [deploy script](../../deploy/deploy.sh).
4. The script pulls that digest, updates only the `nevis` Compose project, and waits for container health. A deployment lock serializes changes. Registry credentials are removed afterward.
5. Actions checks [the public health endpoint](https://nevis.izmailov.dev/healthz). Run workflow on `main` can retry the release.

Repository secrets are `VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT`, `VPS_KNOWN_HOSTS` and `VPS_SSH_KEY`. The dedicated SSH authorized key permits only the deploy command, with no shell or forwarding access.

## 6.4. VPS setup and boundaries

An operator installs [compose.production.yaml](../../compose.production.yaml) and the deploy script under `/home/deploy/nevis-hometask`, and configures the [Caddy route](../../deploy/Caddyfile.nevis). Changes to these server-owned files need a separate sync; app releases only need a push to `main`.

The container has a 256 MiB memory limit, half a CPU, a read-only filesystem and temporary `/tmp` storage. Caddy routes HTTPS through the existing `personal-api_default` network to the unique `nevis-dashboard` alias. The deployment exposes no extra host port and does not update the other API or database containers. Caddy configuration must validate before a reload.

## 6.5. Inspect and roll back

On the VPS:

```sh
cd /home/deploy/nevis-hometask
docker compose --project-name nevis --env-file .env -f compose.production.yaml ps
docker compose --project-name nevis --env-file .env -f compose.production.yaml logs --tail 100
```

During an update, `.env.next` holds the candidate image. If container startup or health fails and a current `.env` exists, the deploy script restores that image. A successful update saves the previous configuration in `.env.previous`. The later public HTTPS check reports a failure but does not itself trigger rollback.

For manual rollback, set `NEVIS_IMAGE` in `.env` to the digest from `.env.previous`, then run:

```sh
docker compose --project-name nevis --env-file .env -f compose.production.yaml up -d --wait dashboard
```

Keep deployment commands scoped to this Compose project. The script does not prune shared images or operate on other projects.
