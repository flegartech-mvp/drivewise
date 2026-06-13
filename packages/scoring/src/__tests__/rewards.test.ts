import { simulateReward, tierFromScore } from '../rewards';
import { RewardTier } from '@drivewise/shared';

describe('simulateReward', () => {
  test('returns PLATINUM for 1000+ km at score 97+', () => {
    const r = simulateReward({ monthlyKm: 1100, averageScore: 98, vehicleType: 'CAR', eventCount: 0 });
    expect(r.tier).toBe(RewardTier.PLATINUM);
    expect(r.simulatedDiscountPercent).toBe(20);
    expect(r.isDemo).toBe(true);
  });

  test('returns GOLD for 800+ km at score 95+', () => {
    const r = simulateReward({ monthlyKm: 900, averageScore: 96, vehicleType: 'CAR', eventCount: 0 });
    expect(r.tier).toBe(RewardTier.GOLD);
    expect(r.simulatedDiscountPercent).toBe(15);
  });

  test('returns SILVER for 400+ km at score 90+', () => {
    const r = simulateReward({ monthlyKm: 500, averageScore: 91, vehicleType: 'CAR', eventCount: 0 });
    expect(r.tier).toBe(RewardTier.SILVER);
  });

  test('returns BRONZE for 200+ km at score 85+', () => {
    const r = simulateReward({ monthlyKm: 250, averageScore: 87, vehicleType: 'CAR', eventCount: 0 });
    expect(r.tier).toBe(RewardTier.BRONZE);
  });

  test('returns NONE below requirements', () => {
    const r = simulateReward({ monthlyKm: 50, averageScore: 70, vehicleType: 'CAR', eventCount: 0 });
    expect(r.tier).toBe(RewardTier.NONE);
    expect(r.simulatedDiscountPercent).toBe(0);
  });

  test('shows next tier requirements when not PLATINUM', () => {
    const r = simulateReward({ monthlyKm: 250, averageScore: 87, vehicleType: 'CAR', eventCount: 0 });
    expect(r.nextTier).toBeDefined();
    expect(r.nextTier).toBe(RewardTier.SILVER);
  });

  test('includes disclaimer text', () => {
    const r = simulateReward({ monthlyKm: 100, averageScore: 80, vehicleType: 'CAR', eventCount: 0 });
    expect(r.disclaimer).toBeTruthy();
    expect(r.disclaimer.length).toBeGreaterThan(10);
  });
});

describe('tierFromScore', () => {
  test('maps score+distance to correct tier', () => {
    expect(tierFromScore(97, 1000)).toBe(RewardTier.PLATINUM);
    expect(tierFromScore(95, 800)).toBe(RewardTier.GOLD);
    expect(tierFromScore(90, 400)).toBe(RewardTier.SILVER);
    expect(tierFromScore(85, 200)).toBe(RewardTier.BRONZE);
    expect(tierFromScore(60, 100)).toBe(RewardTier.NONE);
  });
});
