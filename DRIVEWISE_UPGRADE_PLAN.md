# DriveWise — Dependency Upgrade Plan

Generated: 2026-06-13

## Current vulnerability summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 14 |
| Moderate | 30 |
| Low      | 3 |
| **Total**| **47** |

## Key high-severity issues

| Package | Issue | Safe to fix? |
|---------|-------|--------------|
| `@xmldom/xmldom` | XML injection via unsafe CDATA serialization (GHSA-wh4c-j3r5-mjhp) | Yes — update `@expo/plist` |
| `lodash` | Code injection via `_.template` imports key names (GHSA-r5fr-rjxr-66jc) | Yes — lodash ≥4.17.21 |
| `glob` | CLI command injection via `-c/--cmd` with `shell:true` (GHSA-5j98-mcp5-4vw2) | Yes — glob ≥10.5.0 |
| `esbuild` | Dev server CORS issue (GHSA-67mh-4wv8-2f99) | Dev-only, not in production build |
| `@nestjs/cli` | Transitive via `@angular-devkit/core` | Dev-dependency only |
| `@expo/cli` | Transitive via `@expo/config` | Expo upgrade needed |

## Important context

- **esbuild issue** is dev-server only — it does NOT affect the production build or runtime API.
- **@nestjs/cli** issues are in devDependencies — not present in production deployments.
- **@expo/cli** issues are in devDependencies — mobile build tooling only.
- **The API runtime** (NestJS + Prisma) has 0 critical vulnerabilities in production dependencies.

## Safe fixes (run before public release)

```bash
# Fix lodash and glob (safe, no breaking changes):
npm audit fix

# Check what's left:
npm audit
```

## Fixes requiring caution (breaking changes possible)

```bash
# This may break APIs — test after:
npm audit fix --force
```

## Recommended upgrade path (before production)

1. Run `npm audit fix` — safe fixes only
2. Test: `npm run test && npm run build`
3. Review remaining issues manually
4. Update `@expo/cli` when Expo SDK 53+ is stable
5. Pin `glob` to `>=10.5.0` via overrides in root `package.json`

## What this does NOT affect

- Local development and demo setup: fully working
- All 22+ unit tests: passing
- API startup: confirmed working (NestJS starts, Prisma connected, seed runs)
- SQLite + PostgreSQL both supported

## Status

**MANUAL REQUIRED** — Run `npm audit fix` before first public push. The API and packages are functional for demo and development purposes.
