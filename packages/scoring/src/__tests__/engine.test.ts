import { calculateScore } from '../engine';
import { DrivingEventType, EventSeverity, SpeedLimitConfidence } from '@drivewise/shared';

const now = new Date('2024-01-15T09:00:00Z');
const later = new Date('2024-01-15T09:15:00Z');

function makeInput(overrides: Partial<Parameters<typeof calculateScore>[0]> = {}) {
  return {
    tripId: 'test-1',
    distanceKm: 10,
    durationSeconds: 900,
    startedAt: now,
    endedAt: later,
    events: [],
    ...overrides,
  };
}

describe('calculateScore', () => {
  test('returns 100 + clean trip bonus for clean 10 km trip', () => {
    const result = calculateScore(makeInput());
    expect(result.finalScore).toBe(100);
    expect(result.penalties).toHaveLength(0);
    expect(result.bonuses.length).toBeGreaterThan(0);
  });

  test('clamps to 100 maximum', () => {
    const result = calculateScore(makeInput());
    expect(result.finalScore).toBeLessThanOrEqual(100);
  });

  test('applies -1 per low-severity speeding with high confidence', () => {
    const events = [
      { type: DrivingEventType.SPEEDING, severity: EventSeverity.LOW, speedLimitConfidence: SpeedLimitConfidence.HIGH, value: 7, timestamp: now },
      { type: DrivingEventType.SPEEDING, severity: EventSeverity.LOW, speedLimitConfidence: SpeedLimitConfidence.HIGH, value: 8, timestamp: now },
    ];
    const result = calculateScore(makeInput({ events }));
    const speedPenalty = result.penalties.find((p) => p.reason.includes('5–10'));
    expect(speedPenalty).toBeDefined();
    expect(speedPenalty!.points).toBe(2);
  });

  test('does NOT penalize low-confidence speeding', () => {
    const events = [
      { type: DrivingEventType.SPEEDING, severity: EventSeverity.HIGH, speedLimitConfidence: SpeedLimitConfidence.LOW, value: 30, timestamp: now },
    ];
    const result = calculateScore(makeInput({ events }));
    const speedPenalty = result.penalties.find((p) => p.eventType === DrivingEventType.SPEEDING);
    expect(speedPenalty).toBeUndefined();
    expect(result.warnings.some((w) => w.includes('low/unknown speed-limit confidence'))).toBe(true);
  });

  test('applies -7 per high-severity speeding', () => {
    const events = [
      { type: DrivingEventType.SPEEDING, severity: EventSeverity.HIGH, speedLimitConfidence: SpeedLimitConfidence.HIGH, value: 25, timestamp: now },
    ];
    const result = calculateScore(makeInput({ events }));
    const penalty = result.penalties.find((p) => p.reason.includes('20+'));
    expect(penalty?.points).toBe(7);
  });

  test('applies harsh braking penalty -2 each', () => {
    const events = [
      { type: DrivingEventType.HARSH_BRAKING, severity: EventSeverity.MEDIUM, value: 4, timestamp: now },
      { type: DrivingEventType.HARSH_BRAKING, severity: EventSeverity.LOW, value: 3.5, timestamp: now },
    ];
    const result = calculateScore(makeInput({ events }));
    const penalty = result.penalties.find((p) => p.eventType === DrivingEventType.HARSH_BRAKING);
    expect(penalty?.points).toBe(4); // 2 × 2
  });

  test('applies phone movement penalty -4 each', () => {
    const events = [
      { type: DrivingEventType.PHONE_MOVEMENT, severity: EventSeverity.MEDIUM, value: 2, timestamp: now },
    ];
    const result = calculateScore(makeInput({ events }));
    const penalty = result.penalties.find((p) => p.eventType === DrivingEventType.PHONE_MOVEMENT);
    expect(penalty?.points).toBe(4);
  });

  test('score does not go below 0', () => {
    const events = Array(50).fill(null).map(() => ({
      type: DrivingEventType.SPEEDING, severity: EventSeverity.HIGH, speedLimitConfidence: SpeedLimitConfidence.HIGH, value: 40, timestamp: now,
    }));
    const result = calculateScore(makeInput({ events }));
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
  });

  test('short trip reduces penalty weight', () => {
    const events = [
      { type: DrivingEventType.SPEEDING, severity: EventSeverity.HIGH, speedLimitConfidence: SpeedLimitConfidence.HIGH, value: 25, timestamp: now },
    ];
    const shortTrip = makeInput({ events, distanceKm: 0.5 });
    const normalTrip = makeInput({ events, distanceKm: 10 });
    const shortResult = calculateScore(shortTrip);
    const normalResult = calculateScore(normalTrip);
    expect(shortResult.finalScore).toBeGreaterThan(normalResult.finalScore);
  });

  test('returns explanationText', () => {
    const result = calculateScore(makeInput());
    expect(result.explanationText).toContain('Ocena vožnje');
  });

  test('GPS signal loss produces warning, not penalty', () => {
    const events = [
      { type: DrivingEventType.GPS_SIGNAL_LOSS, severity: EventSeverity.LOW, value: 0, timestamp: now },
    ];
    const result = calculateScore(makeInput({ events }));
    expect(result.penalties.find((p) => p.eventType === DrivingEventType.GPS_SIGNAL_LOSS)).toBeUndefined();
    expect(result.warnings.some((w) => w.includes('GPS signal loss'))).toBe(true);
  });
});
