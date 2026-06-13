import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scores/scoring.service';
import { SpeedLimitService } from '../ingestion/speed-limit.service';
import {
  StartTripDto, BatchTripPointsDto, BatchSensorSamplesDto,
  TripStatus, TripMode, haversineKm, durationSeconds, isNightTime,
} from '@drivewise/shared';
import { EventDetector, enrichSample } from '@drivewise/sensors';
import type { SensorSample } from '@drivewise/shared';

@Injectable()
export class TripsService {
  private readonly detectors = new Map<string, EventDetector>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
    private readonly speedLimit: SpeedLimitService,
  ) {}

  async startTrip(userId: string, dto: StartTripDto) {
    const active = await this.prisma.trip.findFirst({
      where: { userId, status: TripStatus.ACTIVE },
    });
    if (active) throw new BadRequestException('A trip is already active. Finish it first.');

    const trip = await this.prisma.trip.create({
      data: {
        userId,
        vehicleId: dto.vehicleId,
        startedAt: new Date(),
        status: TripStatus.ACTIVE,
        mode: dto.mode ?? TripMode.REAL_DEVICE,
      },
    });
    this.detectors.set(trip.id, new EventDetector());
    return trip;
  }

  async addBatchPoints(userId: string, tripId: string, dto: BatchTripPointsDto) {
    await this.requireActiveTrip(userId, tripId);

    const enriched = await Promise.all(
      dto.points.map(async (p) => {
        const sl = await this.speedLimit.getSpeedLimit(p.latitude, p.longitude);
        return {
          tripId,
          latitude: p.latitude,
          longitude: p.longitude,
          gpsSpeedKmh: p.gpsSpeedKmh,
          altitude: p.altitude,
          heading: p.heading,
          accuracy: p.accuracy,
          timestamp: new Date(p.timestamp),
          speedLimitKmh: sl.speedLimitKmh,
          speedLimitSource: sl.source,
          speedLimitConfidence: sl.confidence,
        };
      }),
    );

    await this.prisma.tripPoint.createMany({ data: enriched });
    return { inserted: enriched.length };
  }

  async addBatchSensorSamples(userId: string, tripId: string, dto: BatchSensorSamplesDto) {
    await this.requireActiveTrip(userId, tripId);
    const detector = this.detectors.get(tripId) ?? new EventDetector();
    this.detectors.set(tripId, detector);

    const sampleRows = dto.samples.map((s) => ({
      tripId,
      ...s,
      timestamp: new Date(s.timestamp),
    }));

    await this.prisma.sensorSample.createMany({ data: sampleRows });

    // Run event detection on uploaded samples
    let prev: SensorSample | null = null;
    const newEvents: object[] = [];

    for (const s of sampleRows) {
      const enriched = enrichSample(s as SensorSample, prev);
      const sl = (enriched.latitude && enriched.longitude)
        ? await this.speedLimit.getSpeedLimit(enriched.latitude, enriched.longitude)
        : null;

      const detected = detector.detectFromSample(
        enriched,
        prev,
        sl?.speedLimitKmh ?? undefined,
        sl?.confidence as any ?? undefined,
      );

      for (const ev of detected) {
        newEvents.push({
          tripId,
          type: ev.type,
          severity: ev.severity,
          latitude: ev.latitude,
          longitude: ev.longitude,
          value: ev.value,
          timestamp: ev.timestamp,
          metadata: JSON.stringify(ev.metadata),
        });
      }
      prev = enriched;
    }

    if (newEvents.length > 0) {
      await this.prisma.drivingEvent.createMany({ data: newEvents as any });
    }

    return { inserted: sampleRows.length, eventsDetected: newEvents.length };
  }

  async finishTrip(userId: string, tripId: string) {
    const trip = await this.requireActiveTrip(userId, tripId);
    const endedAt = new Date();

    // Aggregate stats from stored points
    const points = await this.prisma.tripPoint.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
    });

    let distanceKm = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;

    for (let i = 1; i < points.length; i++) {
      distanceKm += haversineKm(
        points[i - 1].latitude, points[i - 1].longitude,
        points[i].latitude, points[i].longitude,
      );
    }
    for (const p of points) {
      if (p.gpsSpeedKmh) {
        maxSpeed = Math.max(maxSpeed, p.gpsSpeedKmh);
        speedSum += p.gpsSpeedKmh;
        speedCount++;
      }
    }

    const duration = durationSeconds(trip.startedAt, endedAt);

    // Check night driving
    if (isNightTime(trip.startedAt)) {
      await this.prisma.drivingEvent.create({
        data: {
          tripId,
          type: 'NIGHT_DRIVING' as any,
          severity: 'LOW' as any,
          timestamp: trip.startedAt,
          metadata: JSON.stringify({ note: 'Trip started during night hours' }),
        },
      });
    }

    // Calculate score
    const events = await this.prisma.drivingEvent.findMany({ where: { tripId } });
    const scoreResult = await this.scoring.calculateForTrip(trip, events, distanceKm, duration, endedAt);

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        endedAt,
        status: TripStatus.COMPLETED,
        distanceKm,
        durationSeconds: duration,
        averageSpeedKmh: speedCount > 0 ? speedSum / speedCount : 0,
        maxSpeedKmh: maxSpeed,
        score: scoreResult.finalScore,
      },
    });

    this.detectors.delete(tripId);
    return { trip: updated, score: scoreResult };
  }

  async findAll(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: { vehicle: true, _count: { select: { events: true } } },
    });
  }

  async findOne(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { vehicle: true, _count: { select: { events: true, points: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  findPoints(tripId: string) {
    return this.prisma.tripPoint.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
    });
  }

  findEvents(tripId: string) {
    return this.prisma.drivingEvent.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
    });
  }

  findSensorSamples(tripId: string) {
    return this.prisma.sensorSample.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
      take: 5000,
    });
  }

  async getScoreBreakdown(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { events: { orderBy: { timestamp: 'asc' } } },
    });
    if (!trip) throw new (await import('@nestjs/common')).NotFoundException('Trip not found');
    if (!trip.endedAt || trip.score === null) {
      return { tripId, message: 'Trip not yet completed', score: null };
    }
    const result = await this.scoring.calculateForTrip(
      trip,
      trip.events,
      trip.distanceKm,
      trip.durationSeconds,
      trip.endedAt,
    );
    return {
      tripId,
      distanceKm: trip.distanceKm,
      durationSeconds: trip.durationSeconds,
      ...result,
    };
  }

  private async requireActiveTrip(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== TripStatus.ACTIVE) {
      throw new BadRequestException('Trip is not active');
    }
    return trip;
  }
}
