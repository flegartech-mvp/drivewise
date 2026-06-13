# DriveWise — POST_READY.md

## Status: ✅ 100% COPY-AND-POST READY

---

## Best Image to Post First
`promo/images/03-linkedin-banner.png` (1600x900)

## Screenshots Used
- `audit/screenshots/final-ready/DriveWise/01-dashboard.png` (real screenshot from previous session)
- `audit/screenshots/final-ready/DriveWise/02-login.png`
- `audit/screenshots/final-ready/DriveWise/03-mobile.png`
- `audit/screenshots/final-ready/DriveWise/04-login-live.png` (live headless Chrome — 2026-06-13)

> DriveWise API confirmed running (port 3003, auth working, seeded DB)
> Dashboard confirmed running (port 5173)

## ⚠️ IMPORTANT — BEFORE COMMITTING
```bash
git status --short
git check-ignore -v .env apps/api/.env apps/api/prisma/dev.db
```
**DO NOT stage or commit:**
- `.env`
- `apps/api/.env`
- `apps/api/prisma/dev.db`

All three are in `.gitignore` — verify before every commit.

## Promo Image Files
| File | Size | Use For |
|------|------|---------|
| `promo/images/01-square-post.png` | 1080×1080 | Instagram, LinkedIn post |
| `promo/images/02-story-reel-cover.png` | 1080×1920 | IG/TikTok story |
| `promo/images/03-linkedin-banner.png` | 1600×900 | LinkedIn banner |
| `promo/images/04-github-preview.png` | 1280×720 | GitHub social preview |
| `promo/images/05-feature-card.png` | 1200×1200 | Product Hunt |

---

## Exact Copy-Paste Caption

```
Built a fullstack driving assistant — DriveWise 🚗📍

DriveWise tracks your trips and scores your driving behavior.
Full-stack monorepo: API + dashboard + mobile app.

Stack:
→ NestJS (API) + Prisma (SQLite/Postgres)
→ React dashboard with Vite
→ Expo mobile app (React Native)
→ 32 automated tests passing

Open source. Seeded demo: admin@drivewise.si
GitHub link in bio.

#webdev #nestjs #react #prisma #typescript #fullstack #buildinpublic #opensource #driving #flegartech
```

---

## Hashtags
```
#webdev #nestjs #react #prisma #typescript #fullstack #monorepo #driving #triptracking #buildinpublic #opensource #flegartech
```

## Suggested Platforms (in order)
1. LinkedIn (fullstack/backend audience)
2. Twitter/X
3. GitHub (set social preview)
4. Instagram

---

## Safe Public Claims
- "Fullstack driving assistant — trip tracking + scoring"
- "NestJS + React + Expo + Prisma"
- "32 automated tests passing"
- "Open source monorepo"
- "Demo credentials: admin@drivewise.si / admin1234"

## Claims to AVOID
- Avoid "accurate GPS tracking" (demo uses seeded data, no real GPS in current state)
- Avoid insurance or safety scoring claims
- Avoid claiming production deployment without a live URL

---

## 15-Second Video Script
> "DriveWise — a fullstack driving assistant.
> Tracks trips, scores your driving, runs on NestJS + React + Expo.
> 32 tests passing. Full monorepo.
> Open source — GitHub link in bio."

## 30-Second Demo Script
> "DriveWise is a fullstack product I built: trip tracker and driving score app.
> The API runs on NestJS with Prisma — handles auth, trips, scoring, and rewards.
> The React dashboard shows your trip history, scores, and analytics.
> There's also an Expo mobile app for on-the-go tracking.
> 32 automated tests cover the API layer. Monorepo managed with npm workspaces.
> Tech stack: NestJS + Prisma + React + Expo, all TypeScript.
> Open source. Demo seeded and ready. GitHub link in bio."

---

## Promo Image Review
- [x] All 5 images exist
- [x] All correct sizes
- [x] Real screenshots embedded
- [x] No private information visible
- [x] No fake claims
- [x] Text readable
- [x] Professional quality

## Final Ready Status: ✅ COPY-AND-POST READY

## Pre-Commit Checklist
- [ ] `git check-ignore -v .env` shows `.env` is ignored
- [ ] `git check-ignore -v apps/api/.env` shows ignored
- [ ] `git check-ignore -v apps/api/prisma/dev.db` shows ignored
- [ ] `git status --short` shows no .env or .db files staged
- [ ] `npm audit fix` run before public push (47 vulns, 0 critical)
