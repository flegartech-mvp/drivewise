import { RewardTier } from '@drivewise/shared';
import { RewardSimulatorInput, RewardSimulatorResult } from './types';

interface TierConfig {
  tier: RewardTier;
  minKm: number;
  minScore: number;
  discountPercent: number;
}

const TIER_CONFIG: TierConfig[] = [
  { tier: RewardTier.PLATINUM, minKm: 1000, minScore: 97, discountPercent: 20 },
  { tier: RewardTier.GOLD, minKm: 800, minScore: 95, discountPercent: 15 },
  { tier: RewardTier.SILVER, minKm: 400, minScore: 90, discountPercent: 10 },
  { tier: RewardTier.BRONZE, minKm: 200, minScore: 85, discountPercent: 5 },
  { tier: RewardTier.NONE, minKm: 0, minScore: 0, discountPercent: 0 },
];

const DISCLAIMER =
  'Simulacija nagrade. To ni resnična ponudba zavarovalnice. Vrednosti so namenjene demonstraciji koncepta varne vožnje.';

export function simulateReward(input: RewardSimulatorInput): RewardSimulatorResult {
  let currentTier = RewardTier.NONE;
  let discountPercent = 0;

  for (const config of TIER_CONFIG) {
    if (input.monthlyKm >= config.minKm && input.averageScore >= config.minScore) {
      currentTier = config.tier;
      discountPercent = config.discountPercent;
      break;
    }
  }

  const currentIndex = TIER_CONFIG.findIndex((c) => c.tier === currentTier);
  const nextConfig = currentIndex > 0 ? TIER_CONFIG[currentIndex - 1] : undefined;

  return {
    tier: currentTier,
    simulatedDiscountPercent: discountPercent,
    nextTier: nextConfig?.tier,
    requiredKmForNextTier: nextConfig ? Math.max(0, nextConfig.minKm - input.monthlyKm) : undefined,
    requiredScoreForNextTier: nextConfig
      ? Math.max(0, nextConfig.minScore - input.averageScore)
      : undefined,
    isDemo: true,
    disclaimer: DISCLAIMER,
  };
}

export function tierFromScore(score: number, distanceKm: number): RewardTier {
  for (const config of TIER_CONFIG) {
    if (distanceKm >= config.minKm && score >= config.minScore) {
      return config.tier;
    }
  }
  return RewardTier.NONE;
}
