# DriveWise — Driving Telematics MVP

> An open-source driving telematics prototype. Inspired by the concept of usage-based insurance scoring, built from scratch with original code, brand, and architecture.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Monorepo                         │
│                                                      │
│  /apps/mobile        Expo React Native app           │
│  /apps/api           NestJS REST API (port 3000)     │
│  /apps/dashboard     React/Vite admin dashboard      │
│                      (port 5173)                     │
│                                                      │
│  /packages/shared    TypeScript types, Zod schemas   │
│  /packages/scoring   Transparent scoring engine      │
│  /packages/sensors   Event detection, SensorProvider │
│  /packages/simulation  Scenario generator, replay    │
└──────────────────────────────────────────────────────┘
         │               │               │
    PostgreSQL        Redis           OpenStreetMap
    (Prisma ORM)   (optional cache)   Overpass API
                                      OpenWeather API
                                      Promet.si traffic
```

---

## Tech Stack

| Layer          | Technology                                          |
|----------------|-----------------------------------------------------|
| Mobile         | Expo 52, React Native, expo-location, expo-sensors  |
| Backend        | NestJS 10, TypeScript, Prisma, PostgreSQL            |
| Dashboard      | React 18, Vite, Tailwind CSS, Recharts, Leaflet     |
| Shared         | TypeScript, Zod                                     |
| Scoring        | Pure TypeScript, no ML dependencies                 |
| Sensors        | Platform-abstracted SensorProvider interface        |
| Simulation     | Pure TypeScript scenario generator                  |
| Auth           | JWT (passport-jwt), bcryptjs                        |
| Containers     | Docker Compose                                      |

---

## Folder Structure

```
drivewise/
├── apps/
│   ├── api/                    NestJS backend
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── auth/           JWT auth module
│   │       ├── vehicles/       Vehicle management
│   │       ├── trips/          Trip lifecycle + events
│   │       ├── scores/         Score calculation
│   │       ├── rewards/        Reward simulator
│   │       ├── ingestion/      OSM, traffic, weather
│   │       ├── simulation/     Demo trip generation
│   │       ├── admin/          Admin dashboard API
│   │       ├── prisma/         PrismaService
│   │       └── seed/           Database seed
│   ├── dashboard/              React admin dashboard
│   │   └── src/
│   │       ├── pages/          Overview, Trips, RiskMap, etc.
│   │       ├── components/     Shared UI components
│   │       ├── api/            Axios client
│   │       └── store/          Zustand auth store
│   └── mobile/                 Expo React Native app
│       ├── app/                expo-router screens
│       │   ├── (tabs)/         Home, Drive, History, Rewards, Profile
│       │   ├── trip/[id].tsx   Trip detail
│       │   ├── sensor-lab.tsx  Developer sensor lab
│       │   ├── login.tsx
│       │   └── register.tsx
│       └── src/
│           ├── sensors/        RealDevice + Simulation providers
│           ├── store/          Zustand stores (auth, trip)
│           └── api/            Axios API client
├── packages/
│   ├── shared/src/             Types, enums, Zod schemas, geo utils
│   ├── scoring/src/            Scoring engine + reward calculator
│   ├── sensors/src/            Event detector, replay parser
│   └── simulation/src/         Route data, scenarios, generator
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)
- npm 10+

### 1. Clone and install
```bash
git clone <repo>
cd drivewise
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET
```

### 3. Database
```bash
docker compose up -d
cd apps/api
cp ../../.env.example .env   # or create apps/api/.env
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run API
```bash
npm run dev:api
# → http://localhost:3000/api
# → Swagger: http://localhost:3000/api/docs
```

### 5. Run Dashboard
```bash
npm run dev:dashboard
# → http://localhost:5173
# Login: admin@drivewise.si / admin1234
```

### 6. Run Mobile App
```bash
npm run dev:mobile
# Scan QR with Expo Go (iOS/Android)
# or press 'w' for web preview
```

---

## Environment Variables

| Variable               | Description                                       | Default                    |
|------------------------|---------------------------------------------------|----------------------------|
| `DATABASE_URL`         | PostgreSQL connection string                      | Required                   |
| `JWT_SECRET`           | JWT signing secret (min 32 chars)                 | Required                   |
| `PORT`                 | API port                                          | `3000`                     |
| `OVERPASS_API_URL`     | OSM Overpass endpoint                             | Public endpoint            |
| `OPENROUTESERVICE_API_KEY` | Optional route snapping                      | (disabled if blank)        |
| `OPENWEATHER_API_KEY`  | Optional weather enrichment                       | (mock data if blank)       |
| `TRAFFIC_PROVIDER`     | `PROMET` \| `DATEX` \| `NONE`                     | `NONE`                     |
| `PROMET_API_URL`       | Promet.si REST API base URL                       | (optional)                 |
| `ENABLE_SCHEDULERS`    | Enable background import cron jobs                | `false`                    |
| `DEMO_MODE`            | Enable demo data features                         | `true`                     |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile → API URL                            | `http://localhost:3000/api`|
| `VITE_API_BASE_URL`    | Dashboard → API URL                               | `http://localhost:3000/api`|

---

## Commands

```bash
# Root commands
npm run dev               # Start API + Dashboard together
npm run build             # Build all packages and apps
npm run test              # Run all tests
npm run typecheck         # TypeScript check all packages

# Database
docker compose up -d      # Start PostgreSQL
npm run db:migrate        # Run Prisma migrations
npm run db:seed           # Seed demo users + provider status

# Data import
npm run import:osm        # Import OSM road segments (Murska Sobota, Ljubljana, Maribor, Celje)
npm run import:traffic    # Import Slovenian traffic events
npm run import:demo       # Generate 5 demo trips with events and scores

# Individual apps
npm run dev:api
npm run dev:dashboard
npm run dev:mobile
```

---

## How Demo Trip Generation Works

```
POST /api/simulation/trips/generate
Body: { "scenarioId": "aggressive_driver" }
```

1. Selects scenario (14 available).
2. Interpolates GPS route along pre-defined waypoints for demo areas in Slovenia.
3. Generates sensor samples at 5 Hz (accelerometer, gyroscope, GPS).
4. Injects scenario-specific events (braking spikes, speed excess, phone movement).
5. Runs EventDetector on generated samples.
6. Matches GPS points to imported OSM road segments for speed limit lookup.
7. Calculates transparent driving score.
8. Stores trip, points, sensor samples, events in PostgreSQL.
9. Returns JSON with score breakdown.

Available scenarios:
- `safe_city`, `safe_highway`, `aggressive_driver`, `harsh_braking`
- `harsh_acceleration`, `sharp_cornering`, `phone_movement`, `speeding`
- `stop_and_go`, `night_drive`, `rain_context`, `gps_signal_loss`
- `sensor_noise`, `full_risk`

---

## How Sensor Modes Work

The mobile app uses a `SensorProvider` interface. The active mode is chosen in Profile → Senzorji.

| Mode                    | Description                                       |
|-------------------------|---------------------------------------------------|
| `REAL_DEVICE`           | Uses `expo-location` + `expo-sensors` (physical device) |
| `GENERATED_SIMULATION`  | Plays back programmatically generated samples     |
| `REPLAY_FILE`           | Parses a JSONL/CSV replay file (sensor-lab)       |

Battery-saving strategy:
- GPS sampled every 2 seconds while trip is active.
- Accelerometer/gyroscope at 10 Hz.
- Sensor sampling stops when trip is stopped.
- Samples buffered locally, uploaded in batches every 15 seconds.

---

## How Replay Mode Works

Replay files are JSONL (one JSON object per line):
```json
{"timestamp":"2024-01-15T09:00:00Z","lat":46.66,"lng":16.17,"speed":50,"accelX":0.2,...}
```

CSV format also supported (headers: `timestamp,lat,lng,speed,accelX,accelY,accelZ,...`).

Sample replay files are in `/packages/simulation/replay-samples/`.

The `ReplaySensorProvider` (to be added for full production) reads a file and emits samples at real-time or accelerated speed. Sensor Lab screen demonstrates this with the generated simulation provider.

---

## How Scoring Works

All scoring logic is in `/packages/scoring/src/engine.ts`. Fully transparent, zero ML.

**Start score: 100**

Penalties applied per detected event:
| Event                        | Penalty                        |
|------------------------------|--------------------------------|
| Speeding 5–10 km/h over      | -1 per event                   |
| Speeding 10–20 km/h over     | -3 per event                   |
| Speeding 20+ km/h over       | -7 per event                   |
| Harsh braking                | -2 per event                   |
| Harsh acceleration           | -2 per event                   |
| Sharp cornering              | -2 per event                   |
| Possible phone movement      | -4 per event                   |
| Night driving                | -0 to -5 (context modifier)    |

Bonuses:
| Bonus                        | Points                         |
|------------------------------|--------------------------------|
| Clean trip (no events, 1+ km)| +3                             |
| Long clean trip (10+ km)     | +2                             |

Rules:
- Score clamped to [0, 100].
- Short trips (<2 km) have penalties scaled down proportionally.
- Low-confidence speeding events produce a warning, not a penalty.
- GPS signal loss produces a warning only.
- Crash-like spike is experimental — warning only.

---

## How Speed Limit Confidence Works

Speed limits come from OSM data:

| Source                | Confidence | Description                         |
|-----------------------|------------|-------------------------------------|
| `OSM_MAXSPEED`        | HIGH       | Explicit `maxspeed` tag in OSM      |
| `ROAD_TYPE_FALLBACK`  | LOW        | Estimated from road type (highway, residential, etc.) |
| `UNKNOWN`             | UNKNOWN    | No road segment matched             |

When confidence is `LOW` or `UNKNOWN`, speeding events are not penalized — only a warning is shown. This prevents unfair penalization due to data gaps.

Fallback estimates used:
- Motorway: 130 km/h
- Primary road: 90 km/h
- Residential: 50 km/h
- Living street: 10 km/h
- Service road: 30 km/h

---

## Public Data Sources

| Source              | Used for                                | License      |
|---------------------|-----------------------------------------|--------------|
| OpenStreetMap       | Road geometry, types, speed limits       | ODbL         |
| Overpass API        | OSM data query endpoint                  | Public       |
| Promet.si           | Slovenian traffic events (optional)      | Open data    |
| OpenWeather         | Weather enrichment (optional, API key)   | CC-BY-SA / commercial |

**OSM Attribution:** Map data © [OpenStreetMap](https://www.openstreetmap.org) contributors, [ODbL](https://opendatacommons.org/licenses/odbl/).

The Overpass API is a public service. Do not hammer it — the import script adds a 2-second pause between area requests.

---

## Privacy / GDPR

DriveWise collects GPS location and motion sensor data **only during active trips**.

- Data is stored on your own server (self-hosted).
- No data is sent to third parties.
- Admin heatmap coordinates are rounded to ~110 m grid (3 decimal places) for anonymization.
- Users can request data export and account deletion (demo stubs in Profile screen).
- Individual trip routes are NOT visible in the admin heatmap — only anonymized event clusters.

**Disclaimer:** DriveWise is a prototype. It is NOT a certified insurance scoring system. All scores are estimates for coaching and feedback purposes only. They are not suitable for legal, insurance, or employment decisions.

---

## Battery and Performance Notes

- Trip tracking stops all sensors when the trip is ended.
- GPS is polled at 2-second intervals (not continuous).
- Accelerometer/gyroscope at 10 Hz (100ms intervals).
- Samples are batched and uploaded every 15 seconds, not per-sample.
- For production, consider background location using `expo-task-manager` with a foreground service on Android.
- Background tracking in Expo Go is limited. Use a development build for full background GPS.

---

## Known Limitations

| Limitation | Description |
|---|---|
| Background GPS (Expo Go) | Expo Go pauses location when app is backgrounded. Use a dev build for production background tracking. |
| OSM speed limits | ~30–60% of road segments in Slovenia have explicit `maxspeed` tags. The rest use road-type fallbacks (LOW confidence). |
| Traffic API | Promet.si REST endpoint format may change. DATEX II XML parsing is stubbed. |
| Crash detection | Experimental only. High acceleration spikes can be caused by road bumps or phone drops. |
| Phone movement | Detection is probabilistic. High gyro + accel during driving does not guarantee phone usage. |
| Replay file provider | Full file-picker UI for replay file loading is not yet wired in the mobile app. The sensor lab uses generated simulation instead. |

---

## Testing Results

**Unit tests** — `/packages/scoring`, `/packages/sensors`, `/packages/simulation`

To run:
```bash
npm run test
```

Tests cover:
- Scoring engine: clean trip, penalties, bonuses, confidence filtering, clamping
- Reward tiers: all 5 tiers, next-tier requirements, disclaimer
- Event detection: harsh braking/acceleration, cornering, phone movement, speeding, debounce
- Sample enrichment: velocity acceleration computation, accel magnitude
- Replay parser: JSONL and CSV parsing, timestamp sorting, comment skipping, malformed input
- Simulation generator: all 14 scenarios, GPS coordinates, timestamps, JSONL export

**Integration test flow** (manual with seed data):
1. `npm run db:seed` → creates demo users
2. `npm run import:demo` → generates 5 demo trips with events and scores
3. Open dashboard → Overview → trips and scores visible
4. Simulation page → generate a trip → score breakdown displayed
5. Risk Map → event markers visible (anonymized)
6. Data Sources → provider statuses visible

---

## Roadmap

### Near-term
- [ ] Full background tracking implementation (foreground service on Android)
- [ ] Replay file picker UI in mobile sensor lab
- [ ] DATEX II XML traffic event parser
- [ ] Route map view in mobile trip detail (react-native-maps)
- [ ] Monthly score trend chart (mobile home screen)

### Medium-term
- [ ] Machine learning driving behavior model (replaces threshold-based detection)
- [ ] Crash detection hardening (multi-sensor fusion)
- [ ] Fraud detection (impossible speed, GPS spoofing detection)
- [ ] Fleet/company dashboard
- [ ] Family accounts
- [ ] Real-time WebSocket alerts during trip

### Long-term
- [ ] App Store / Google Play production checklist
- [ ] Real insurer integration via standard telematics API
- [ ] Production GDPR/legal review
- [ ] Advanced risk heatmaps with road segment risk scoring
- [ ] Offline mode with local scoring
- [ ] Driver coaching AI (personalized tips)
- [ ] OBD-II integration for vehicle speed and engine data

---

## License

MIT — see LICENSE file.

This project is NOT affiliated with Triglav, DRAJV, or any insurance company. It is an independent open-source prototype for educational and research purposes.

---

Made by FlegarTech. If this project helped you, you can [support development](https://paypal.me/TiniFlegar).
