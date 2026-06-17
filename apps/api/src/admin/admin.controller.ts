import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

type FraudFlag = { reason: string; detail: string };

function detectFraud(trip: {
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  status: string;
  mode: string;
  _count: { points: number; events: number };
}): { status: 'NORMAL' | 'SUSPICIOUS' | 'INVALID'; flags: FraudFlag[] } {
  const flags: FraudFlag[] = [];

  if (trip.maxSpeedKmh > 300) flags.push({ reason: 'impossible_speed', detail: `Max speed ${trip.maxSpeedKmh} km/h exceeds physical limit` });
  if (trip.distanceKm > 0 && trip.durationSeconds > 0) {
    const impliedSpeed = (trip.distanceKm / trip.durationSeconds) * 3600;
    if (impliedSpeed > 280) flags.push({ reason: 'impossible_distance_time', detail: `Implied avg speed ${impliedSpeed.toFixed(0)} km/h` });
  }
  if (trip.distanceKm < 0.1 && trip.status === 'COMPLETED') flags.push({ reason: 'too_short', detail: `Distance only ${trip.distanceKm.toFixed(2)} km` });
  if (trip._count.points < 5 && trip.distanceKm > 1) flags.push({ reason: 'missing_gps_samples', detail: `Only ${trip._count.points} GPS points for ${trip.distanceKm.toFixed(1)} km` });
  if (trip.durationSeconds > 0 && trip.durationSeconds < 30 && trip.distanceKm > 0.5) flags.push({ reason: 'unrealistic_duration', detail: `${trip.durationSeconds}s for ${trip.distanceKm.toFixed(1)} km` });

  if (flags.length === 0) return { status: 'NORMAL', flags: [] };
  if (flags.some((f) => f.reason === 'impossible_speed' || f.reason === 'impossible_distance_time')) return { status: 'INVALID', flags };
  return { status: 'SUSPICIOUS', flags };
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const [totalUsers, totalTrips, totalEvents, segments, trafficEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.trip.count(),
      this.prisma.drivingEvent.count(),
      this.prisma.roadSegment.count(),
      this.prisma.trafficEvent.count(),
    ]);

    const completedTrips = await this.prisma.trip.findMany({
      where: { status: 'COMPLETED', score: { not: null } },
      select: { score: true, distanceKm: true },
    });

    const scores = completedTrips.map((t) => t.score!).filter(Boolean);
    const totalDistance = completedTrips.reduce((a, t) => a + t.distanceKm, 0);

    return {
      totalUsers,
      totalTrips,
      totalEvents,
      roadSegments: segments,
      trafficEvents,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
      completedTrips: completedTrips.length,
    };
  }

  @Get('users')
  async users() {
    return this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { trips: true, vehicles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('trips')
  async trips() {
    const rows = await this.prisma.trip.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: true,
        _count: { select: { events: true, points: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });
    return rows.map((t) => {
      const fraud = detectFraud(t as any);
      return { ...t, fraud };
    });
  }

  @Get('events')
  async events() {
    return this.prisma.drivingEvent.findMany({
      include: { trip: { select: { userId: true, mode: true } } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });
  }

  @Get('heatmap')
  async heatmap() {
    const events = await this.prisma.drivingEvent.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { latitude: true, longitude: true, type: true, severity: true },
      take: 2000,
    });
    // Anonymize: cluster to 3 decimal places (~110 m grid)
    return events.map((e) => ({
      lat: Math.round(e.latitude! * 1000) / 1000,
      lng: Math.round(e.longitude! * 1000) / 1000,
      type: e.type,
      severity: e.severity,
    }));
  }

  @Get('road-intelligence')
  async roadIntelligence() {
    const total = await this.prisma.roadSegment.count();
    const withSpeedLimit = await this.prisma.roadSegment.count({
      where: { maxSpeedKmh: { not: null } },
    });

    const byType = await this.prisma.roadSegment.groupBy({
      by: ['roadType'],
      _count: { id: true },
    });

    return {
      totalSegments: total,
      withSpeedLimit,
      missingSpeedLimitPercent: total > 0
        ? Math.round(((total - withSpeedLimit) / total) * 100)
        : 0,
      byRoadType: byType,
    };
  }

  @Get('data-sources')
  async dataSources() {
    const [statuses, recentLogs] = await Promise.all([
      this.prisma.apiProviderStatus.findMany(),
      this.prisma.dataImportLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20,
      }),
    ]);
    return { statuses, recentLogs };
  }
}
