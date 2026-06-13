# DriveWise — Product Pitch

## One-Sentence Pitch

DriveWise is an open-source driving telematics platform that records trips via mobile app, scores driving behavior with a transparent TypeScript algorithm, and visualizes risk on an interactive map — no black box, no vendor lock-in.

## Product Description

DriveWise is a full-stack telematics MVP that turns phone sensors into driving intelligence. The mobile app (Expo React Native) captures GPS and accelerometer data during trips. The NestJS API processes and stores that data via Prisma and PostgreSQL. The React dashboard surfaces driver scores, trip history, a risk map powered by OpenStreetMap, and a rewards simulator — giving both drivers and fleet operators a complete picture of driving behavior.

Every component is purpose-built for transparency and extensibility. The scoring engine is pure TypeScript with no external dependencies — you can read exactly how scores are calculated, tune the weights, and audit every output. Docker Compose brings up the entire stack in one command. Simulation mode generates realistic demo trips without a real phone, so you can evaluate the full system before deploying hardware. Whether you're researching telematics, building an insurance scoring demo, or releasing an open-source showcase, DriveWise gives you a production-grade foundation to build on.

## Top 5 Features

- **Transparent scoring engine** — pure TypeScript, no external ML dependencies, every scoring decision is auditable and tunable
- **Full-stack monorepo** — NestJS API + React dashboard + Expo mobile app + shared TypeScript types and Zod schemas in one repo
- **Simulation mode** — generates realistic demo trip data without a physical phone; perfect for demos and CI
- **Risk map** — OpenStreetMap-based visualization of risky driving segments across all recorded trips
- **One-command Docker setup** — `docker compose up` brings up API, database, and dashboard with seed data pre-loaded

## 30-Second Demo Flow

1. Run `docker compose up` — API, PostgreSQL, and dashboard start automatically
2. Open the React dashboard at `http://localhost:5173` — driver score, trip count, and risk summary are visible on login
3. Navigate to Trip History — see a list of simulated trips with distance, duration, and score per trip
4. Click a trip — detailed timeline with GPS trace and flagged events (hard braking, sharp turn) appears
5. Open the Risk Map — color-coded road segments show where risky driving is concentrated across all trips

## Target Audience

- Insurance tech teams building usage-based insurance (UBI) scoring prototypes
- Fleet management startups that need a telematics foundation without building from scratch
- Academic researchers studying driving behavior, risk modeling, or mobile sensing
- Open-source contributors and developers showcasing full-stack TypeScript/React Native work
