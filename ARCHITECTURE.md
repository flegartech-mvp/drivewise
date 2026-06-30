# Architecture

## Overview
DriveWise is an npm-workspaces monorepo for a driving telematics MVP. It contains a NestJS API, a Vite admin dashboard, an Expo mobile app, and shared TypeScript packages for schemas, scoring, sensor processing, and simulation.

## Components
- **API** — NestJS REST API under `apps/api`, with JWT auth, Prisma, Swagger, ingestion, simulation, trips, scoring, rewards, and admin endpoints.
- **Dashboard** — React/Vite admin UI under `apps/dashboard`, served as a static SPA and configured with `VITE_API_BASE_URL`.
- **Mobile** — Expo app under `apps/mobile`, configured with `EXPO_PUBLIC_API_BASE_URL`.
- **Packages** — shared schemas/types plus pure TypeScript scoring, sensor, and simulation packages.
- **Database** — PostgreSQL schema and migrations in `apps/api/prisma`.

## Data flow
Mobile clients create trips and upload GPS/sensor batches to the API. The API enriches points with speed-limit context, detects risky events, calculates transparent driving scores, and stores trip data in PostgreSQL. The dashboard authenticates as an admin and reads aggregated stats, users, trips, risk-map points, data-source status, and simulation results.

## External dependencies
- PostgreSQL is required for API persistence.
- Redis is provisioned by compose for future cache/scheduler use.
- OpenStreetMap Overpass, Promet.si/DATEX, and OpenWeather are optional ingestion/enrichment providers.
- CARTO/OpenStreetMap tiles are used by dashboard map views.
