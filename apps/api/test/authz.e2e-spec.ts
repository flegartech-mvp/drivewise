/**
 * Authorization / authentication regression tests exercised at the HTTP boundary.
 *
 * These boot the full Nest application (the same AppModule, global pipes and
 * filters used by `main.ts`) against a *disposable* PostgreSQL database — never
 * the developer or production database. The harness lives in
 * `test/run-e2e.sh`, which provisions a throwaway Postgres container, points
 * DATABASE_URL at it and runs this suite.
 *
 * The suite proves the trip ownership / role model documented in
 * trips.service.ts (`tripAccessWhere`): a driver may only see their own trips,
 * an administrator may see any trip, unauthenticated requests are rejected, and
 * non-owned / unknown / malformed ids do not leak data.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ZodValidationPipe } from '../src/common/zod-validation.pipe';
import { ZodExceptionFilter } from '../src/common/zod-exception.filter';

const PWD = 'Sup3rSecret!';

describe('Auth & trip authorization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Seeded fixtures
  let driverAToken: string;
  let driverBToken: string;
  let adminToken: string;
  let driverATripId: string;
  let driverBTripId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mirror main.ts bootstrap so tests hit the real request pipeline.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new ZodExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean slate on the disposable DB.
    await prisma.sensorSample.deleteMany();
    await prisma.tripPoint.deleteMany();
    await prisma.drivingEvent.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.reward.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash(PWD, 12);
    const [driverA, driverB, admin] = await Promise.all([
      prisma.user.create({ data: { name: 'Driver A', email: 'a@drivewise.test', passwordHash, role: 'DRIVER' } }),
      prisma.user.create({ data: { name: 'Driver B', email: 'b@drivewise.test', passwordHash, role: 'DRIVER' } }),
      prisma.user.create({ data: { name: 'Admin', email: 'admin@drivewise.test', passwordHash, role: 'ADMIN' } }),
    ]);

    const tripA = await prisma.trip.create({
      data: { userId: driverA.id, startedAt: new Date(), status: 'COMPLETED', endedAt: new Date(), distanceKm: 5, durationSeconds: 600, score: 88 },
    });
    const tripB = await prisma.trip.create({
      data: { userId: driverB.id, startedAt: new Date(), status: 'COMPLETED', endedAt: new Date(), distanceKm: 3, durationSeconds: 400, score: 75 },
    });
    driverATripId = tripA.id;
    driverBTripId = tripB.id;

    // Add a point and an event to driver A's trip so ownership-scoped child
    // collections have something to (not) leak.
    await prisma.tripPoint.create({
      data: { tripId: tripA.id, latitude: 46.05, longitude: 14.5, timestamp: new Date() },
    });
    await prisma.drivingEvent.create({
      data: { tripId: tripA.id, type: 'HARSH_BRAKING', severity: 'MEDIUM', timestamp: new Date() },
    });

    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: PWD })
        .expect(201);
      return res.body.accessToken as string;
    };
    driverAToken = await login('a@drivewise.test');
    driverBToken = await login('b@drivewise.test');
    adminToken = await login('admin@drivewise.test');
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  describe('Authentication', () => {
    it('rejects invalid login with 401', async () => {
      await http()
        .post('/api/auth/login')
        .send({ email: 'a@drivewise.test', password: 'wrong-password' })
        .expect(401);
    });

    it('rejects login for unknown user with 401', async () => {
      await http()
        .post('/api/auth/login')
        .send({ email: 'nobody@drivewise.test', password: PWD })
        .expect(401);
    });

    it('rejects malformed login body with 400 (zod validation)', async () => {
      await http()
        .post('/api/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('accepts valid login and returns a token', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: 'a@drivewise.test', password: PWD })
        .expect(201);
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('never returns the password hash from /auth/me', async () => {
      const res = await http().get('/api/auth/me').set(auth(driverAToken)).expect(200);
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.email).toBe('a@drivewise.test');
    });
  });

  describe('Unauthenticated access is denied', () => {
    it.each([
      ['GET', '/api/trips'],
      ['GET', `/api/trips/${'PLACEHOLDER'}`],
      ['GET', '/api/admin/trips'],
      ['GET', '/api/admin/stats'],
    ])('%s %s without a token returns 401', async (method, path) => {
      const url = path.replace('PLACEHOLDER', () => driverATripId);
      await (http() as any)[method.toLowerCase()](url).expect(401);
    });

    it('rejects a garbage/forged bearer token with 401', async () => {
      await http().get('/api/trips').set(auth('not.a.real.jwt')).expect(401);
    });
  });

  describe('Driver can access their own trip', () => {
    it('GET /trips/:id returns the owner their trip', async () => {
      const res = await http().get(`/api/trips/${driverATripId}`).set(auth(driverAToken)).expect(200);
      expect(res.body.id).toBe(driverATripId);
    });

    it('GET /trips lists only the caller’s own trips', async () => {
      const res = await http().get('/api/trips').set(auth(driverAToken)).expect(200);
      const ids = res.body.map((t: { id: string }) => t.id);
      expect(ids).toContain(driverATripId);
      expect(ids).not.toContain(driverBTripId);
    });

    it.each([
      ['points', `/api/trips/PLACEHOLDER/points`],
      ['events', `/api/trips/PLACEHOLDER/events`],
      ['sensor-samples', `/api/trips/PLACEHOLDER/sensor-samples`],
      ['score-breakdown', `/api/trips/PLACEHOLDER/score-breakdown`],
    ])('owner can read own trip %s', async (_label, path) => {
      await http().get(path.replace('PLACEHOLDER', driverATripId)).set(auth(driverAToken)).expect(200);
    });
  });

  describe('Driver CANNOT access another driver’s trip', () => {
    it('GET /trips/:id for someone else’s trip returns 404 (no leak)', async () => {
      await http().get(`/api/trips/${driverBTripId}`).set(auth(driverAToken)).expect(404);
    });

    it.each([
      ['points', `/api/trips/PLACEHOLDER/points`],
      ['events', `/api/trips/PLACEHOLDER/events`],
      ['sensor-samples', `/api/trips/PLACEHOLDER/sensor-samples`],
      ['score-breakdown', `/api/trips/PLACEHOLDER/score-breakdown`],
    ])('cross-tenant read of %s is denied with 404', async (_label, path) => {
      await http().get(path.replace('PLACEHOLDER', driverBTripId)).set(auth(driverAToken)).expect(404);
    });

    it('cannot append points to another driver’s trip (404)', async () => {
      await http()
        .post(`/api/trips/${driverBTripId}/points/batch`)
        .set(auth(driverAToken))
        .send({ points: [{ latitude: 46, longitude: 14, timestamp: new Date().toISOString() }] })
        .expect(404);
    });

    it('cannot finish another driver’s trip (404)', async () => {
      await http().post(`/api/trips/${driverBTripId}/finish`).set(auth(driverAToken)).expect(404);
    });
  });

  describe('Administrator authorization', () => {
    it('admin can read any driver’s trip detail', async () => {
      await http().get(`/api/trips/${driverATripId}`).set(auth(adminToken)).expect(200);
      await http().get(`/api/trips/${driverBTripId}`).set(auth(adminToken)).expect(200);
    });

    it('admin can read child collections of any trip', async () => {
      await http().get(`/api/trips/${driverBTripId}/points`).set(auth(adminToken)).expect(200);
      await http().get(`/api/trips/${driverBTripId}/events`).set(auth(adminToken)).expect(200);
    });

    it('admin can reach admin-only endpoints', async () => {
      await http().get('/api/admin/stats').set(auth(adminToken)).expect(200);
      await http().get('/api/admin/trips').set(auth(adminToken)).expect(200);
    });

    it('a DRIVER cannot reach admin-only endpoints (403)', async () => {
      await http().get('/api/admin/stats').set(auth(driverAToken)).expect(403);
      await http().get('/api/admin/trips').set(auth(driverAToken)).expect(403);
      await http().get('/api/admin/users').set(auth(driverAToken)).expect(403);
    });
  });

  describe('Unknown / malformed identifiers', () => {
    it('unknown trip id returns 404 for a driver', async () => {
      await http().get('/api/trips/clnonexistent00000000000000').set(auth(driverAToken)).expect(404);
    });

    it('unknown trip id returns 404 even for admin', async () => {
      await http().get('/api/trips/clnonexistent00000000000000').set(auth(adminToken)).expect(404);
    });

    it('malformed point batch body is rejected with 400', async () => {
      // Create an active trip for driver A to target a real, owned trip.
      const start = await http().post('/api/trips/start').set(auth(driverAToken)).send({}).expect(201);
      const activeId = start.body.id;
      await http()
        .post(`/api/trips/${activeId}/points/batch`)
        .set(auth(driverAToken))
        .send({ points: [{ latitude: 999, longitude: 14, timestamp: 'not-a-date' }] })
        .expect(400);
    });
  });
});
