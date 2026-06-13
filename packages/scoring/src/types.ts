import { DrivingEventType, EventSeverity, SpeedLimitConfidence, RewardTier } from '@drivewise/shared';

export interface ScoringInput {
  tripId: string;
  distanceKm: number;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
  events: ScoringEvent[];
  hasWeather?: WeatherContext;
}

export interface ScoringEvent {
  type: DrivingEventType;
  severity: EventSeverity;
  speedLimitConfidence?: SpeedLimitConfidence;
  value?: number;
  timestamp: Date;
}

export interface WeatherContext {
  rain?: number;
  snow?: number;
  fog?: number;
  visibility?: number;
}

export interface DriverLevel {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  label: string;
  labelSl: string;
  minScore: number;
  maxScore: number;
  emoji: string;
  color: string;
  progressToNext: number;
  nextTier?: string;
  nextMinScore?: number;
}

export interface ScoreResult {
  finalScore: number;
  baseScore: number;
  penalties: ScorePenalty[];
  bonuses: ScoreBonus[];
  warnings: string[];
  eventSummary: EventSummary;
  confidenceSummary: ConfidenceSummary;
  explanationText: string;
  driverLevel: DriverLevel;
  recommendations: string[];
  topWeaknesses: string[];
  topStrengths: string[];
}

export interface ScorePenalty {
  reason: string;
  points: number;
  eventType: DrivingEventType;
  count: number;
}

export interface ScoreBonus {
  reason: string;
  points: number;
}

export interface EventSummary {
  totalEvents: number;
  byType: Partial<Record<DrivingEventType, number>>;
  highSeverityCount: number;
}

export interface ConfidenceSummary {
  speedingEventsWithLowConfidence: number;
  speedingEventsWithHighConfidence: number;
  speedLimitUnavailableCount: number;
  note?: string;
}

export interface RewardSimulatorInput {
  monthlyKm: number;
  averageScore: number;
  vehicleType: string;
  eventCount: number;
}

export interface RewardSimulatorResult {
  tier: RewardTier;
  simulatedDiscountPercent: number;
  nextTier?: RewardTier;
  requiredKmForNextTier?: number;
  requiredScoreForNextTier?: number;
  isDemo: true;
  disclaimer: string;
}
