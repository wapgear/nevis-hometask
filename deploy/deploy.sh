#!/usr/bin/env bash
set -euo pipefail
umask 077

# The repository's SSH key can only invoke this server-owned command.
IFS= read -r image
IFS= read -r registry_user
IFS= read -r registry_token
if [[ ! "$image" =~ ^ghcr\.io/wapgear/nevis-hometask@sha256:[a-f0-9]{64}$ ]] ||
   [[ ! "$registry_user" =~ ^[a-zA-Z0-9_-]+$ ]] || [[ -z "$registry_token" ]]; then
  printf 'Invalid deployment request.\n' >&2
  exit 1
fi

cd /home/deploy/nevis-hometask
exec 9>.deploy.lock
flock -w 300 9

DOCKER_CONFIG=$(mktemp -d)
export DOCKER_CONFIG
trap 'rm -rf "$DOCKER_CONFIG"; rm -f .env.next' EXIT
printf '%s' "$registry_token" | docker login ghcr.io --username "$registry_user" --password-stdin
unset registry_token

printf 'NEVIS_IMAGE=%s\n' "$image" > .env.next
docker compose --project-name nevis --env-file .env.next -f compose.production.yaml pull dashboard

if ! docker compose --project-name nevis --env-file .env.next -f compose.production.yaml \
  up -d --no-build --wait --wait-timeout 120 dashboard; then
  if [[ -f .env ]]; then
    printf 'Deployment failed; restoring the previous Nevis image.\n' >&2
    docker compose --project-name nevis --env-file .env -f compose.production.yaml \
      up -d --no-build --wait --wait-timeout 120 dashboard
  fi
  exit 1
fi

if [[ -f .env ]]; then
  cp .env .env.previous
fi
mv .env.next .env
docker compose --project-name nevis --env-file .env -f compose.production.yaml ps
