# Deployment — DriveWise

Monorepo (npm workspaces):
- **`apps/api`** — NestJS REST API + Swagger (`/api/docs`), Prisma ORM, JWT auth.
- **`apps/dashboard`** — Vite + React admin dashboard (static SPA).
- **`apps/mobile`** — Expo / React Native (ships via EAS / app stores — out of scope for web deploy).
- **`packages/*`** — `shared`, `scoring`, `sensors`, `simulation` (built libs).

## Verified locally
- `npm ci` · `npm run prisma:generate` · `npx prisma validate` ✅
- `npm run db:push` (SQLite) + `npm run db:seed` ✅ (creates demo accounts)
- `npm run build` — all workspaces incl. `apps/api/dist/main.js`, `apps/dashboard/dist` ✅
- API runtime: `node apps/api/dist/main` → `/health` 200, `POST /api/auth/login` (seeded admin) returns JWT, bad login / no-token → 401 ✅
- `docker build -f apps/api/Dockerfile .` ✅ ; `docker compose up` (postgres+redis healthchecks) ✅

## Database: SQLite (default) vs PostgreSQL (production)
The Prisma schema ships with **`provider = "sqlite"`** (zero-setup local dev; verified). `docker-compose.yml` provisions **PostgreSQL 16 + Redis 7** for production-like use.

There are **no migrations yet** (dev uses `prisma db push`). To go to Postgres in production:
1. In `apps/api/prisma/schema.prisma` set `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL=postgresql://drivewise:...@host:5432/drivewise`.
3. Create the first migration once: `npm run db:migrate --workspace=apps/api` (i.e. `prisma migrate dev --name init`). Commit `apps/api/prisma/migrations/`.
4. In production run **`npx prisma migrate deploy`** (never `migrate dev` / `db push` in prod).

> Prisma `binaryTargets` already include `debian-openssl-3.0.x` and `-1.1.x` so the engine resolves in Docker/PaaS images.

## API build / run
| Command | Purpose |
|---------|---------|
| `npm ci` | Install all workspaces |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run build` | Build packages + api + dashboard |
| `node apps/api/dist/main` | Start API (binds `PORT`, default 3000; health `/health`) |
| `npm run db:seed --workspace=apps/api` | Seed demo data |

> ⚠️ The build script previously ran `nest build --webpack false`, which actually **enabled** webpack bundling and broke Prisma's query-engine resolution at runtime (`node dist/main` crashed). Fixed to `nest build` (tsc output). Now verified working.

## API Docker (VPS / Fly)
```bash
# context = repo root
docker build -f apps/api/Dockerfile -t drivewise-api .
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://drivewise:secret@db:5432/drivewise" \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e CORS_ORIGIN="https://dashboard.example.com" \
  drivewise-api
```
Non-root user, `HEALTHCHECK` on `/health`. For SQLite mount a volume for the db file.

## Recommended hosting
| Component | Primary | Fallback |
|-----------|---------|----------|
| API (NestJS) | **Railway / Render** web service (build from source: `npm ci && npm run build`, start `node apps/api/dist/main`) + managed Postgres | Fly.io / VPS with the Docker image + compose Postgres |
| Dashboard (Vite SPA) | **Vercel / Netlify** static (build `npm run build --workspace=apps/dashboard`, output `apps/dashboard/dist`, SPA fallback) | Any static host |
| Mobile (Expo) | EAS Build → App Store / Play Store | n/a |

## Environment variables (server-only) — see `.env.example`
`DATABASE_URL`, `JWT_SECRET` (**required, ≥32 chars; prod refuses the `change_me` default**), `PORT`, `NODE_ENV`, `CORS_ORIGIN` (comma list; `*` with warning if unset in prod), `ENABLE_SCHEDULERS`, plus optional ingestion keys (`OVERPASS_API_URL`, `OPENROUTESERVICE_API_KEY`, `OPENWEATHER_API_KEY`, `TRAFFIC_PROVIDER`, `DATEX_API_URL`, `PROMET_API_URL`).

## Backup / restore (PostgreSQL)
```bash
docker exec drivewise_postgres pg_dump -U drivewise drivewise > backup.sql      # backup
cat backup.sql | docker exec -i drivewise_postgres psql -U drivewise drivewise  # restore
```
The `postgres_data` named volume persists data across restarts.

## Security notes
- Seed creates demo accounts (`admin@drivewise.si` / `voznik@drivewise.si`, simple passwords) — **change or remove before any public deployment**.
- `JWT_SECRET` must be strong and secret. CORS should be locked to known origins in prod (`CORS_ORIGIN`).
- Host port 5432 may conflict with a local Postgres; remap if `docker compose up` reports "address already in use".
