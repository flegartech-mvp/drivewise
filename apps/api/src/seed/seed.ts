import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateTrip, type ScenarioId } from '@drivewise/simulation';
import { calculateScore } from '@drivewise/scoring';
import { EventDetector, enrichSample } from '@drivewise/sensors';
import { DrivingEventType, EventSeverity } from '@drivewise/shared';

const prisma = new PrismaClient();

const DEMO_SCENARIOS: Array<{ scenarioId: string; label: string }> = [
  { scenarioId: 'safe_city', label: 'Varna mestna vožnja' },
  { scenarioId: 'safe_highway', label: 'Varna vožnja po avtocesti' },
  { scenarioId: 'aggressive_driver', label: 'Agresivni voznik' },
  { scenarioId: 'phone_movement', label: 'Možen premik telefona' },
  { scenarioId: 'night_drive', label: 'Nočna vožnja' },
];

async function generateDemoTrip(userId: string, scenarioId: string) {
  const generated = generateTrip({ scenarioId: scenarioId as ScenarioId, addNoise: true });

  const trip = await prisma.trip.create({
    data: {
      userId,
      startedAt: generated.startedAt,
      endedAt: generated.endedAt,
      distanceKm: generated.distanceKm,
      durationSeconds: Math.round((generated.endedAt.getTime() - generated.startedAt.getTime()) / 1000),
      status: 'COMPLETED',
      mode: 'GENERATED_SIMULATION',
      averageSpeedKmh: 0,
      maxSpeedKmh: 0,
    },
  });

  const pointRows = generated.samples
    .filter((s) => s.latitude && s.longitude)
    .map((s) => ({
      tripId: trip.id,
      latitude: s.latitude!,
      longitude: s.longitude!,
      gpsSpeedKmh: s.gpsSpeedKmh,
      altitude: s.altitude,
      accuracy: s.gpsAccuracy,
      timestamp: s.timestamp,
    }));

  if (pointRows.length > 0) {
    for (let i = 0; i < pointRows.length; i += 100) {
      await prisma.tripPoint.createMany({ data: pointRows.slice(i, i + 100) });
    }
  }

  const detector = new EventDetector();
  const events: Prisma.DrivingEventCreateManyInput[] = [];
  let prev = null;
  let maxSpeed = 0;
  let speedSum = 0;
  let speedCount = 0;

  for (const sample of generated.samples) {
    const enriched = enrichSample(sample, prev);
    const detected = detector.detectFromSample(enriched, prev, undefined, undefined);
    for (const ev of detected) {
      events.push({
        tripId: trip.id,
        type: ev.type,
        severity: ev.severity,
        latitude: ev.latitude,
        longitude: ev.longitude,
        value: ev.value,
        timestamp: ev.timestamp,
        metadata: JSON.stringify(ev.metadata),
      });
    }
    if (enriched.gpsSpeedKmh) {
      maxSpeed = Math.max(maxSpeed, enriched.gpsSpeedKmh);
      speedSum += enriched.gpsSpeedKmh;
      speedCount++;
    }
    prev = enriched;
  }

  if (events.length > 0) {
    for (let i = 0; i < events.length; i += 100) {
      await prisma.drivingEvent.createMany({ data: events.slice(i, i + 100) });
    }
  }

  const allEvents = await prisma.drivingEvent.findMany({ where: { tripId: trip.id } });
  const scoringEvents = allEvents.map((e) => ({
    type: e.type as DrivingEventType,
    severity: e.severity as EventSeverity,
    value: e.value ?? undefined,
    timestamp: e.timestamp,
  }));

  const duration = Math.round((generated.endedAt.getTime() - generated.startedAt.getTime()) / 1000);
  const result = calculateScore({
    tripId: trip.id,
    distanceKm: generated.distanceKm,
    durationSeconds: duration,
    startedAt: generated.startedAt,
    endedAt: generated.endedAt,
    events: scoringEvents,
  });

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      score: result.finalScore,
      averageSpeedKmh: speedCount > 0 ? speedSum / speedCount : 0,
      maxSpeedKmh: maxSpeed,
    },
  });

  return { tripId: trip.id, score: result.finalScore };
}

async function main() {
  console.log('🌱 Seeding DriveWise database…');

  const adminHash = await bcrypt.hash('admin1234', 12);
  const driverHash = await bcrypt.hash('driver1234', 12);

  await prisma.user.upsert({
    where: { email: 'admin@drivewise.si' },
    update: {},
    create: {
      name: 'Admin DriveWise',
      email: 'admin@drivewise.si',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'voznik@drivewise.si' },
    update: {},
    create: {
      name: 'Demo Voznik',
      email: 'voznik@drivewise.si',
      passwordHash: driverHash,
      role: 'DRIVER',
    },
  });

  await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-1' },
    update: {},
    create: {
      id: 'seed-vehicle-1',
      userId: driver.id,
      plateNumber: 'MS AB-123',
      vehicleType: 'CAR',
    },
  });

  await prisma.apiProviderStatus.upsert({
    where: { provider: 'OSM_OVERPASS' },
    update: {},
    create: { provider: 'OSM_OVERPASS', status: 'UNKNOWN' },
  });
  await prisma.apiProviderStatus.upsert({
    where: { provider: 'PROMET' },
    update: {},
    create: { provider: 'PROMET', status: 'UNKNOWN' },
  });
  await prisma.apiProviderStatus.upsert({
    where: { provider: 'OPENWEATHER' },
    update: {},
    create: { provider: 'OPENWEATHER', status: 'UNKNOWN' },
  });

  // Generate demo trips for the driver only if none exist
  const existingTrips = await prisma.trip.count({ where: { userId: driver.id } });
  if (existingTrips === 0) {
    console.log('🚗 Generating demo trips…');
    for (const scenario of DEMO_SCENARIOS) {
      try {
        const result = await generateDemoTrip(driver.id, scenario.scenarioId);
        console.log(`  ✅ ${scenario.label}: score ${result.score}/100 (trip: ${result.tripId})`);
      } catch (err) {
        console.warn(`  ⚠ Failed to generate ${scenario.scenarioId}:`, err);
      }
    }
  } else {
    console.log(`ℹ Skipping demo trips — ${existingTrips} already exist for demo driver.`);
  }

  console.log(`✅ Admin:  admin@drivewise.si / admin1234`);
  console.log(`✅ Driver: voznik@drivewise.si / driver1234`);
  console.log('🌱 Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
