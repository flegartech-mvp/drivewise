#!/usr/bin/env bash
#
# Run the API e2e/authorization suite against a DISPOSABLE PostgreSQL database.
#
# This never touches the developer or production database: it provisions a
# throwaway Docker container, pushes the Prisma schema into it, runs the suite
# and tears the container down again.
#
# Usage:  bash apps/api/test/run-e2e.sh
#
set -euo pipefail

CONTAINER="dw-test-db"
PORT="${E2E_DB_PORT:-55432}"
export DATABASE_URL="postgresql://test:test@localhost:${PORT}/drivewise_test"
export JWT_SECRET="test_secret_used_only_for_e2e_runs_0123456789"
export NODE_ENV="test"

cleanup() {
  if [ "${E2E_KEEP_DB:-}" != "1" ]; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# (Re)create the disposable database container.
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=drivewise_test \
  -p "${PORT}:5432" postgres:16-alpine >/dev/null

echo "Waiting for PostgreSQL to accept connections..."
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U test >/dev/null 2>&1; then break; fi
  sleep 1
done

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
npx prisma db push --schema="$ROOT/apps/api/prisma/schema.prisma" --skip-generate

npx jest --config "$ROOT/apps/api/test/jest-e2e.json" --runInBand "$@"
