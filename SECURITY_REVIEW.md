# DriveWise — Security Review (Release Pass v2)

_Generated: 2026-06-22 — blocker-remediation pass following the previous
`READY WITH EXTERNAL BLOCKERS` verdict._

## 1. Summary

| Scanner | Before this pass | After this pass |
|---------|------------------|-----------------|
| `npm audit` | 69 (0 critical · 13 high · 53 moderate · 3 low) | **41 (0 critical · 4 high · 37 moderate · 0 low)** |
| `osv-scanner` (lockfile) | 16 distinct advisory IDs | **9 distinct advisory IDs** |

**Production API server attack surface: 0 known vulnerabilities.**

Every one of the 41 remaining `npm audit` findings resolves to one of three
roots that are **not** part of the deployed API server:

1. `expo` / `expo-router` / `expo-linking` — the mobile app and its build tooling.
2. `react-native` — the mobile app and its Metro bundler / build tooling.
3. `ts-jest` / `jest-cli` — the test runner (devDependency only).

The previous pass had written security `overrides` into `package.json` but never
re-ran `npm install`, so the lockfile recorded `overrides: {}` and **none of them
were applied**. This pass regenerated the lockfile (the overrides now take
effect), upgraded NestJS 10 → 11, and added a scoped `js-yaml` override, which
together cleared the entire API-runtime dependency chain.

## 2. Root-cause: why the count was "stuck" at 69

`multer` was still `2.0.2` and top-level `lodash` still `4.17.21` despite
`package.json` declaring `multer ^2.2.0` / `lodash ^4.18.1`. The lockfile's
`overrides` block was empty. A clean `rm -rf node_modules package-lock.json &&
npm install` applied them: `multer 2.2.0`, `lodash 4.18.1`, `glob 10.5.0`,
`@xmldom/xmldom 0.9.10`, `undici 6.27.0`, `postcss 8.5.15`, `qs 6.15.2`.
Result: 69 → 56.

> Note: `lodash@4.18.1` is a legitimate 2026 release that patches the
> `_.template` code-injection advisory (GHSA-r5fr-rjxr-66jc); it is not a typo or
> a supply-chain artifact (verified against the npm registry).

## 3. High / critical reachable vulnerabilities

**There are 0 critical findings and 0 high/critical findings reachable from the
production API server.**

The 4 remaining `high` findings are all in the Expo/React-Native chain:

| Package | Advisory | Where it lives | Reachable in prod API? | Reachable in shipped mobile app? |
|---------|----------|----------------|------------------------|----------------------------------|
| `expo` | meta-pkg pulling `tar`/`cacache` highs | mobile app + build | No (not installed on server) | Build-time meta-package |
| `@expo/cli` | transitive | mobile build tooling | No | No (CLI, not bundled) |
| `cacache` | GHSA (cache poisoning) | expo/npm download cache | No | No (build-time) |
| `tar` (6.2.1) | path traversal / symlink (GHSA-34x7…, -8qq5…, …) | expo prebuild/export | No | No (build-time extraction) |

`tar`, `cacache`, and `@expo/cli` execute only during `expo export` / `prebuild`
on a developer machine or CI runner — never on the production API server and not
inside the distributed mobile binary. They require attacker-controlled archives
to exploit, which is not part of the DriveWise build inputs.

## 4. The one API-runtime advisory and why it is resolved + was unreachable

`@nestjs/core` **GHSA-36xv-jgw5-4q75** (moderate) — SSE injection in
`SseStream._transform()` via unsanitised `\r`/`\n` in `message.type`/`message.id`.

- **Reachability (pre-upgrade):** NOT reachable. DriveWise exposes no
  Server-Sent-Events endpoints — there is no `@Sse()` decorator, no
  `text/event-stream`, and no `MessageEvent` usage anywhere in `apps/api/src`.
  The vulnerable code path is never invoked.
- **Remediation:** Fixed regardless by upgrading to NestJS 11.1.27, which also
  cleared the transitive `@nestjs/cli` / `@angular-devkit` chain (`picomatch`,
  `tmp`, `ajv`, `glob`).
- The last NestJS item, `@nestjs/swagger` → nested `js-yaml@4.1.1`, was bumped to
  `4.2.0` via a **scoped** override (`"@nestjs/swagger": { "js-yaml": "^4.2.0" }`).
  The `js-yaml@3.x` copies under `metro`/`@istanbuljs` are intentionally left
  alone — js-yaml v4 is a breaking API change and those are dev/build tooling.

After NestJS 11 + the swagger override, **no `@nestjs/*` package is flagged by
either scanner.**

## 5. Triage table (remaining 41 npm-audit findings)

All remaining findings, grouped by root and classification. None are runtime
dependencies of the API server (`apps/api` production `dependencies`).

| Group | Representative packages | Severity | Class | Fix path | Action |
|-------|-------------------------|----------|-------|----------|--------|
| Expo runtime/build | `expo`, `@expo/cli`, `@expo/config*`, `expo-asset`, `expo-constants`, `expo-router`, `expo-linking`, `cacache`, `tar`, `xcode`, `uuid` | high/moderate | Mobile app + mobile build tooling | `expo@56` (SDK 52→56, major) | **Deferred** — see §6 |
| React Native | `react-native`, `metro`, `metro-config`, `metro-transform-worker`, `@react-native/community-cli-plugin`, `cosmiconfig` | moderate | Mobile app + Metro bundler | `react-native@0.86` (major, via SDK 56) | **Deferred** — see §6 |
| Jest test runner | `jest`, `jest-cli`, `@jest/*`, `ts-jest`, `babel-jest`, `babel-plugin-istanbul`, `@istanbuljs/load-nyc-config`, `create-jest` | moderate | devDependency (tests only) | `jest@30` (major) | **Accepted** — test-only, not shipped |
| YAML (dev tooling) | `js-yaml@3.14.2` under `metro-config`, `@istanbuljs` | moderate | dev/build tooling | js-yaml v4 (breaking) | **Accepted** — not shipped; v4 breaks metro/istanbul |

Deduplication note: `osv-scanner` reports 9 IDs (`js-yaml`, `tar`, `uuid`) — a
subset of the `npm audit` set, because OSV dedupes by advisory ID and only flags
the lockfile entries it can resolve. Both tools agree the surviving advisories
are confined to the Expo/RN and dev-tooling chains.

## 6. Deferred major upgrade — Expo SDK 52 → 56

**Blocker:** A 4-major-version Expo jump (SDK 52 → 56, React Native 0.76 → 0.86)
requires iOS/Android simulators or devices and a full mobile QA cycle (startup,
navigation, permissions, sensors, API connectivity) to verify safely. That
hardware/runtime is not available in this environment, and the New-Architecture
changes between these SDKs make an unverified upgrade a regression risk for the
mobile app.

**Affected vulnerabilities:** the entire Expo/RN group in §5 (4 high, ~30 moderate).

**Reachability of the blocker:** None of these packages run on the production API
server. The mobile app is a separate artifact distributed through the app stores;
`@expo/cli`/`tar`/`cacache`/`metro` are build-time only. The DriveWise server
release is therefore **not gated** on the Expo upgrade.

**Mitigation / plan:**
- Track Expo SDK 56 upgrade in `TODO.md`; perform it on a branch with simulator
  verification before the next *mobile* release.
- Mobile dependency drift within SDK 52 (e.g. `react-native 0.76.5 → 0.76.9`) is
  available via `npx expo install --check`; deferred together with the SDK bump
  to avoid an unverifiable partial change.
- The mobile app already type-checks cleanly on SDK 52.

## 7. Other verification evidence

- `gitleaks detect` over the working tree and all 7 git commits: **no leaks found.**
- No `.env`, database, or secret files are tracked by git (`.gitignore` verified;
  only `.env.example` files are committed).
- `JWT_SECRET` is enforced (≥32 chars, non-default) in production at boot
  (`apps/api/src/main.ts`); CORS defaults to an allowlist via `CORS_ORIGIN`.
- API authorization is proven by 30 HTTP-boundary e2e tests (see
  `apps/api/test/authz.e2e-spec.ts`).

## 8. Accepted residual risks

| # | Risk | Justification | Evidence |
|---|------|---------------|----------|
| 1 | Expo/RN high+moderate advisories | Mobile app + build tooling; not on the production API server; mobile is a separately-released artifact | §3, §5, §6; root-cause classification |
| 2 | Jest / istanbul / js-yaml 3.x moderates | devDependencies and build tooling; never shipped to any runtime | §5 |
| 3 | Demo seed credentials (`admin1234` / `driver1234`) shown on login | Demo data only; flagged in `TODO.md` for removal before public deployment | login screenshot, `apps/api/src/seed/seed.ts` |

None of the accepted risks are reachable on the production API server or expose
production data.
