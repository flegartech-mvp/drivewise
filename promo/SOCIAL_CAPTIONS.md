# DriveWise — Social Captions

## TikTok / Reels (≤150 chars)

> Full-stack driving telematics app: phone records your trip, TypeScript scores your driving, map shows the risk zones 🚗 #buildinpublic #typescript #openSource

---

## X / Twitter (≤280 chars)

> Built DriveWise: open-source telematics MVP. Mobile app records GPS + accelerometer. Transparent TypeScript scoring engine. Risk map. Rewards simulator. Full Docker setup. No black box — you can read every line of the scoring logic. Repo link below.

---

## LinkedIn

Telematics software is usually a black box. You get a score, no explanation, and no way to audit the logic. I built DriveWise to be the opposite.

DriveWise is a full-stack driving telematics MVP: Expo React Native mobile app captures trips via GPS and accelerometer, a NestJS API processes and stores the data, and a React dashboard shows driver scores, trip history, a risk map, and a rewards simulator. The scoring engine is pure TypeScript — no external ML libraries, no proprietary weights. You can read exactly how each score is produced and tune it yourself.

The whole stack runs with `docker compose up`. Simulation mode generates realistic trips without a real phone, so you can demo the full system on any machine. Monorepo structure with shared types and Zod schemas across API and mobile. Open source, MIT licensed.

Built for teams doing telematics research, insurance scoring prototypes, or anyone who wants a serious full-stack TypeScript showcase. Repo in comments.
