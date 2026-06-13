import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { simulateReward, tierFromScore } from '@drivewise/scoring';
import { monthKey } from '@drivewise/shared';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyRewards(userId: string) {
    return this.prisma.reward.findMany({
      where: { userId },
      orderBy: { month: 'desc' },
      take: 12,
    });
  }

  async getSimulation(userId: string) {
    const currentMonth = monthKey(new Date());
    const trips = await this.prisma.trip.findMany({
      where: { userId, status: 'COMPLETED', startedAt: { gte: new Date(`${currentMonth}-01`) } },
    });

    const distanceKm = trips.reduce((a, t) => a + t.distanceKm, 0);
    const scores = trips.map((t) => t.score ?? 0).filter(Boolean);
    const averageScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const eventCount = await this.prisma.drivingEvent.count({
      where: { trip: { userId, startedAt: { gte: new Date(`${currentMonth}-01`) } } },
    });

    return simulateReward({
      monthlyKm: distanceKm,
      averageScore,
      vehicleType: 'CAR',
      eventCount,
    });
  }

  async upsertMonthlyReward(userId: string) {
    const month = monthKey(new Date());
    const trips = await this.prisma.trip.findMany({
      where: { userId, status: 'COMPLETED', startedAt: { gte: new Date(`${month}-01`) } },
    });
    if (!trips.length) return null;

    const distanceKm = trips.reduce((a, t) => a + t.distanceKm, 0);
    const scores = trips.map((t) => t.score ?? 0).filter(Boolean);
    const averageScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const tier = tierFromScore(averageScore, distanceKm);
    const sim = simulateReward({ monthlyKm: distanceKm, averageScore, vehicleType: 'CAR', eventCount: 0 });

    return this.prisma.reward.upsert({
      where: { userId_month: { userId, month } },
      update: { score: averageScore, distanceKm, tier, simulatedDiscountPercent: sim.simulatedDiscountPercent },
      create: { userId, month, score: averageScore, distanceKm, tier, simulatedDiscountPercent: sim.simulatedDiscountPercent },
    });
  }
}
