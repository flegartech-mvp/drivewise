import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateScore } from '@drivewise/scoring';
import { DrivingEventType, EventSeverity, SpeedLimitConfidence, monthKey } from '@drivewise/shared';
import type { Trip, DrivingEvent } from '@prisma/client';

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateForTrip(
    trip: Trip,
    events: DrivingEvent[],
    distanceKm: number,
    durationSeconds: number,
    endedAt: Date,
  ) {
    const scoringEvents = events.map((e) => {
      const meta = (typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata) as Record<string, unknown>;
      return {
        type: e.type as DrivingEventType,
        severity: e.severity as EventSeverity,
        speedLimitConfidence: meta?.['speedLimitConfidence'] as SpeedLimitConfidence | undefined,
        value: e.value ?? undefined,
        timestamp: e.timestamp,
      };
    });

    const result = calculateScore({
      tripId: trip.id,
      distanceKm,
      durationSeconds,
      startedAt: trip.startedAt,
      endedAt,
      events: scoringEvents,
    });

    return result;
  }

  async getMonthlySummary(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { userId, status: 'COMPLETED', score: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 12,
    });

    const byMonth = new Map<string, { scores: number[]; distance: number }>();
    for (const t of trips) {
      const key = monthKey(t.startedAt);
      if (!byMonth.has(key)) byMonth.set(key, { scores: [], distance: 0 });
      const entry = byMonth.get(key)!;
      if (t.score !== null) entry.scores.push(t.score);
      entry.distance += t.distanceKm;
    }

    return Array.from(byMonth.entries()).map(([month, data]) => ({
      month,
      averageScore: data.scores.length
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : null,
      tripCount: data.scores.length,
      distanceKm: Math.round(data.distance * 10) / 10,
    }));
  }

  async getSummary(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { userId, status: 'COMPLETED', score: { not: null } },
    });
    const scores = trips.map((t) => t.score!).filter(Boolean);
    return {
      totalTrips: trips.length,
      averageScore: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
      totalDistanceKm: Math.round(trips.reduce((a, t) => a + t.distanceKm, 0) * 10) / 10,
      bestScore: scores.length ? Math.max(...scores) : null,
      worstScore: scores.length ? Math.min(...scores) : null,
    };
  }

  async getAchievements(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { events: true },
      orderBy: { startedAt: 'asc' },
    });

    const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0);
    const scores = trips.map((t) => t.score).filter((s): s is number => s !== null);
    const hasPerfect = scores.some((s) => s === 100);
    const nightTrips = trips.filter((t) => {
      const h = new Date(t.startedAt).getHours();
      return h >= 22 || h < 6;
    });

    const last7 = trips.filter((t) => {
      const days = (Date.now() - new Date(t.startedAt).getTime()) / 86400000;
      return days <= 7;
    });
    const noSpeedingWeek = last7.length >= 3 && last7.every((t) =>
      t.events.every((e) => e.type !== 'SPEEDING'),
    );

    const last5Scores = scores.slice(-5);
    const isConsistent = last5Scores.length >= 5 &&
      Math.max(...last5Scores) - Math.min(...last5Scores) <= 10;

    const achievements = [
      {
        id: 'first_trip',
        label: 'Prva vožnja',
        labelEn: 'First Trip',
        description: 'Zaključite svojo prvo vožnjo.',
        emoji: '🚗',
        unlocked: trips.length >= 1,
        unlockedAt: trips[0]?.endedAt,
      },
      {
        id: 'ten_trips',
        label: '10 Voženj',
        labelEn: '10 Trips Completed',
        description: 'Zaključite 10 voženj.',
        emoji: '🎯',
        unlocked: trips.length >= 10,
        unlockedAt: trips[9]?.endedAt,
      },
      {
        id: 'hundred_km',
        label: '100 km Varno',
        labelEn: '100 km Safe Driving',
        description: 'Prevozite 100 km skupaj.',
        emoji: '🛣️',
        unlocked: totalKm >= 100,
        unlockedAt: null,
      },
      {
        id: 'perfect_trip',
        label: 'Popolna Vožnja',
        labelEn: 'Perfect Trip',
        description: 'Dosežite oceno 100/100 na vožnji.',
        emoji: '⭐',
        unlocked: hasPerfect,
        unlockedAt: null,
      },
      {
        id: 'no_speeding_week',
        label: 'Teden Brez Hitrosti',
        labelEn: 'No Speeding Week',
        description: 'Prekoračite hitrost 0-krat v zadnjih 7 dneh.',
        emoji: '✅',
        unlocked: noSpeedingWeek,
        unlockedAt: null,
      },
      {
        id: 'smooth_driver',
        label: 'Mehak Voznik',
        labelEn: 'Smooth Driver',
        description: 'Zaključite 3 vožnje brez sunkovitega zaviranja.',
        emoji: '🌊',
        unlocked: trips.filter((t) => t.events.every((e) => e.type !== 'HARSH_BRAKING')).length >= 3,
        unlockedAt: null,
      },
      {
        id: 'night_driver',
        label: 'Nočni Voznik',
        labelEn: 'Night Driver',
        description: 'Zaključite vsaj 1 nočno vožnjo.',
        emoji: '🌙',
        unlocked: nightTrips.length >= 1,
        unlockedAt: nightTrips[0]?.endedAt,
      },
      {
        id: 'consistent_driver',
        label: 'Dosleden Voznik',
        labelEn: 'Consistent Driver',
        description: 'Zadnjih 5 voženj z razliko v oceni ≤ 10 točk.',
        emoji: '📈',
        unlocked: isConsistent,
        unlockedAt: null,
      },
    ];

    const unlocked = achievements.filter((a) => a.unlocked).length;
    return { achievements, unlocked, total: achievements.length };
  }

  async getWeeklyReport(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    const [thisWeekTrips, lastWeekTrips, events] = await Promise.all([
      this.prisma.trip.findMany({
        where: { userId, status: 'COMPLETED', startedAt: { gte: weekAgo } },
        include: { events: true },
      }),
      this.prisma.trip.findMany({
        where: { userId, status: 'COMPLETED', startedAt: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
      this.prisma.drivingEvent.findMany({
        where: { trip: { userId }, timestamp: { gte: weekAgo } },
      }),
    ]);

    const scores = thisWeekTrips.map((t) => t.score).filter((s): s is number => s !== null);
    const lastScores = lastWeekTrips.map((t) => t.score).filter((s): s is number => s !== null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null;
    const lastAvg = lastScores.length ? Math.round(lastScores.reduce((a, b) => a + b) / lastScores.length) : null;
    const bestTrip = thisWeekTrips.reduce((best, t) => (!best || (t.score ?? 0) > (best.score ?? 0)) ? t : best, null as typeof thisWeekTrips[0] | null);
    const worstTrip = thisWeekTrips.reduce((worst, t) => (!worst || (t.score ?? 100) < (worst.score ?? 100)) ? t : worst, null as typeof thisWeekTrips[0] | null);

    const eventByType: Record<string, number> = {};
    for (const e of events) {
      eventByType[e.type] = (eventByType[e.type] ?? 0) + 1;
    }

    return {
      period: 'week',
      tripCount: thisWeekTrips.length,
      totalKm: Math.round(thisWeekTrips.reduce((s, t) => s + t.distanceKm, 0) * 10) / 10,
      totalSeconds: thisWeekTrips.reduce((s, t) => s + t.durationSeconds, 0),
      averageScore: avgScore,
      previousAverageScore: lastAvg,
      improvement: avgScore !== null && lastAvg !== null ? avgScore - lastAvg : null,
      bestTrip: bestTrip ? { id: bestTrip.id, score: bestTrip.score, distanceKm: bestTrip.distanceKm, startedAt: bestTrip.startedAt } : null,
      worstTrip: worstTrip ? { id: worstTrip.id, score: worstTrip.score, distanceKm: worstTrip.distanceKm, startedAt: worstTrip.startedAt } : null,
      harshEvents: (eventByType['HARSH_BRAKING'] ?? 0) + (eventByType['HARSH_ACCELERATION'] ?? 0),
      speedingEvents: eventByType['SPEEDING'] ?? 0,
      phoneEvents: eventByType['PHONE_MOVEMENT'] ?? 0,
      eventByType,
    };
  }
}
