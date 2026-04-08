#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

set -a
source "$ROOT_DIR/.env"
set +a

DB_IP="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' modetrain-db)"

if [[ -z "$DB_IP" ]]; then
  echo "No se ha podido resolver la IP de modetrain-db." >&2
  exit 1
fi

export DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_IP}:5432/${POSTGRES_DB}"

exec "$@"
