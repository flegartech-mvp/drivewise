# Commands

## Install
npm ci

## Dev
npm run dev

## Typecheck
npm run typecheck

## Test
npm test

## Build
npm run build

## Database
npm run prisma:generate
npm run db:migrate
npx prisma studio --schema=apps/api/prisma/schema.prisma

## Docker
docker compose up -d
docker compose down
docker compose logs -f
