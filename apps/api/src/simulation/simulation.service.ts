import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scores/scoring.service';
import { generateTrip, SCENARIOS } from '@drivewise/simulation';
import { TripMode, TripStatus } from '@drivewise/shared';
import { EventDetector, enrichSample } from '@drivewise/sensors';
import { SpeedLimitService } from '../ingestion/speed-limit.service';
import type { ScenarioId } from '@drivewise/simulation';

const BATCH_SIZE = 100;

@Injectable()
export class SimulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
    private readonly speedLimit: SpeedLimitService,
  ) {}

  getScenarios() {
    return SCENARIOS.map(({ id, label, labelSl, description, durationSeconds }) => ({
      id, label, labelSl, description, durationSeconds,
    }));
  }

  async generateDemoTrip(userId: string, scenarioId: ScenarioId) {
    const generated = generateTrip({ scenarioId, addNoise: true });

    const trip = await this.prisma.trip.create({
      data: {
        userId,
        startedAt: generated.startedAt,
        endedAt: generated.endedAt,
        distanceKm: generated.distanceKm,
        durationSeconds: Math.round(
          (generated.endedAt.getTime() - generated.startedAt.getTime()) / 1000,
        ),
        status: TripStatus.COMPLETED,
        mode: TripMode.GENERATED_SIMULATION,
        averageSpeedKmh: 0,
        maxSpeedKmh: 0,
      },
    });

    // Store GPS points from samples
    const pointRows = generated.samples
      .filter((s) => s.latitude && s.longitude)
      .map((s) => ({
        tripId: trip.id,
        latitude: s.latitude!,
        longitude: s.longitude!,
        gpsSpeedKmh: s.gpsSpeedKmh,
        altitude: s.altitude,
        heading: s.heading,
        accuracy: s.gpsAccuracy,
        timestamp: s.timestamp,
      }));

    // Batch insert GPS points
    for (let i = 0; i < pointRows.length; i += BATCH_SIZE) {
      await this.prisma.tripPoint.createMany({
        data: pointRows.slice(i, i + BATCH_SIZE),
      });
    }

    // Run event detection on generated samples
    const detector = new EventDetector();
    const events: Prisma.DrivingEventCreateManyInput[] = [];
    let prev = null;
    let maxSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;

    for (const sample of generated.samples) {
      const enriched = enrichSample(sample, prev);
      const sl = enriched.latitude && enriched.longitude
        ? await this.speedLimit.getSpeedLimit(enriched.latitude, enriched.longitude)
        : null;

      const detected = detector.detectFromSample(
        enriched,
        prev,
        sl?.speedLimitKmh ?? undefined,
        sl?.confidence ?? undefined,
      );

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
      for (let i = 0; i < events.length; i += BATCH_SIZE) {
        await this.prisma.drivingEvent.createMany({ data: events.slice(i, i + BATCH_SIZE) });
      }
    }

    // Store sensor samples (sampled — take every 5th to avoid DB bloat in demo)
    const sampleRows = generated.samples
      .filter((_, idx) => idx % 5 === 0)
      .map((s) => ({ tripId: trip.id, ...s, id: undefined }));

    for (let i = 0; i < sampleRows.length; i += BATCH_SIZE) {
      await this.prisma.sensorSample.createMany({
        data: sampleRows.slice(i, i + BATCH_SIZE) as Prisma.SensorSampleCreateManyInput[],
      });
    }

    const allEvents = await this.prisma.drivingEvent.findMany({ where: { tripId: trip.id } });
    const scoreResult = await this.scoring.calculateForTrip(
      trip,
      allEvents,
      generated.distanceKm,
      Math.round((generated.endedAt.getTime() - generated.startedAt.getTime()) / 1000),
      generated.endedAt,
    );

    await this.prisma.trip.update({
      where: { id: trip.id },
      data: {
        score: scoreResult.finalScore,
        averageSpeedKmh: speedCount > 0 ? speedSum / speedCount : 0,
        maxSpeedKmh: maxSpeed,
      },
    });

    return {
      tripId: trip.id,
      scenarioId,
      distanceKm: Math.round(generated.distanceKm * 100) / 100,
      samplesGenerated: generated.samples.length,
      eventsDetected: events.length,
      score: scoreResult,
      isDemo: true,
    };
  }
}
