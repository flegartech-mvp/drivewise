# DriveWise — Safe Public Claims

## SAFE TO CLAIM

- Full-stack telematics monorepo: NestJS API, React/Vite/Tailwind dashboard, Expo React Native mobile app, Prisma ORM, PostgreSQL
- Trip recording via mobile app using device GPS and accelerometer data
- Driving behavior scoring engine written in pure TypeScript — no external ML libraries, fully auditable logic
- Risk map powered by OpenStreetMap showing color-coded road segments based on recorded trip events
- Simulation mode generates realistic demo trip data without a physical mobile device
- Docker Compose brings up the complete stack (API, database, dashboard) with one command and Prisma seed data
- Shared TypeScript types and Zod schemas enforced across API and mobile packages in the monorepo
- JWT-based authentication for driver and admin roles

## DO NOT CLAIM

- Do not claim this is a validated insurance scoring system — the scoring algorithm is a demonstration model, not a certified actuarial tool
- Do not claim real-time or production-grade GPS accuracy — performance depends on device hardware and Expo's sensor APIs
- Do not claim this replaces commercial telematics hardware (OBD devices, dashcams) — it is a software-only MVP using phone sensors
- Do not claim the rewards simulator outputs real insurance quotes or legally binding premium calculations
- Do not claim GDPR or data privacy compliance without additional review — location and behavioral data handling needs legal assessment before any user-facing deployment
