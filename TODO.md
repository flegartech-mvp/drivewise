# TODO

## Release Follow-Ups

- [x] Upgrade NestJS 10 → 11 (done; clears the API-runtime advisory chain — see SECURITY_REVIEW.md).
- [x] Add API HTTP-boundary authorization e2e tests (done; 30 tests in `apps/api/test/authz.e2e-spec.ts`).
- [ ] Expo SDK 52 → 56 major upgrade — deferred (needs simulator/device QA; not on the production-server attack surface). See SECURITY_REVIEW.md §6.
- [ ] Add first-class dashboard e2e tests (login, admin trip detail, simulation generation) with Playwright.
- [ ] Add production observability/error reporting integration.
- [ ] Replace demo seed credentials (`admin1234` / `driver1234`) and remove the demo-credential hint on the login page before any public deployment.
