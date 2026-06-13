import { EventDetector, enrichSample } from '../detection';
import { DrivingEventType, EventSeverity, SpeedLimitConfidence } from '@drivewise/shared';
import type { SensorSample } from '@drivewise/shared';

function makeSample(overrides: Partial<SensorSample> = {}): SensorSample {
  return {
    timestamp: new Date(),
    latitude: 46.66,
    longitude: 16.17,
    gpsSpeedKmh: 50,
    gpsAccuracy: 5,
    ...overrides,
  };
}

describe('EventDetector', () => {
  let detector: EventDetector;

  beforeEach(() => {
    detector = new EventDetector();
  });

  test('detects harsh braking when longitudinal acceleration < -3', () => {
    const sample = makeSample({ estimatedLongitudinalAcceleration: -4.5, gpsSpeedKmh: 60 });
    const events = detector.detectFromSample(sample, null);
    expect(events.some((e) => e.type === DrivingEventType.HARSH_BRAKING)).toBe(true);
  });

  test('does NOT detect harsh braking at low speed', () => {
    const sample = makeSample({ estimatedLongitudinalAcceleration: -5, gpsSpeedKmh: 5 });
    const events = detector.detectFromSample(sample, null);
    expect(events.some((e) => e.type === DrivingEventType.HARSH_BRAKING)).toBe(false);
  });

  test('detects harsh acceleration when longitudinal acceleration > 3', () => {
    const sample = makeSample({ estimatedLongitudinalAcceleration: 4.0, gpsSpeedKmh: 50 });
    const events = detector.detectFromSample(sample, null);
    expect(events.some((e) => e.type === DrivingEventType.HARSH_ACCELERATION)).toBe(true);
  });

  test('detects sharp cornering when lateral acceleration > 2.5', () => {
    const sample = makeSample({ estimatedLateralAcceleration: 3.5, gpsSpeedKmh: 40 });
    const events = detector.detectFromSample(sample, null);
    expect(events.some((e) => e.type === DrivingEventType.SHARP_CORNERING)).toBe(true);
  });

  test('detects possible phone movement', () => {
    const sample = makeSample({
      gpsSpeedKmh: 40,
      gyroX: 1.0, gyroY: 1.0, gyroZ: 0.5,
      gyroMagnitude: 2.0,
      accelX: 2.0, accelY: 2.0, accelZ: 9.8,
      accelMagnitude: 9.8 + 3.5,
    });
    const events = detector.detectFromSample(sample, null);
    expect(events.some((e) => e.type === DrivingEventType.PHONE_MOVEMENT)).toBe(true);
  });

  test('detects speeding when speed exceeds limit', () => {
    const sample = makeSample({ gpsSpeedKmh: 75 });
    const events = detector.detectFromSample(sample, null, 50, SpeedLimitConfidence.HIGH);
    expect(events.some((e) => e.type === DrivingEventType.SPEEDING)).toBe(true);
  });

  test('does NOT detect speeding when speed is within limit', () => {
    const sample = makeSample({ gpsSpeedKmh: 48 });
    const events = detector.detectFromSample(sample, null, 50, SpeedLimitConfidence.HIGH);
    expect(events.some((e) => e.type === DrivingEventType.SPEEDING)).toBe(false);
  });

  test('debounces repeat events within 3 seconds', () => {
    const t0 = new Date();
    const t1 = new Date(t0.getTime() + 1000);
    const s0 = makeSample({ estimatedLongitudinalAcceleration: -5, gpsSpeedKmh: 60, timestamp: t0 });
    const s1 = makeSample({ estimatedLongitudinalAcceleration: -5, gpsSpeedKmh: 60, timestamp: t1 });
    detector.detectFromSample(s0, null);
    const events = detector.detectFromSample(s1, s0);
    expect(events.filter((e) => e.type === DrivingEventType.HARSH_BRAKING)).toHaveLength(0);
  });

  test('allows same event after debounce window', () => {
    const t0 = new Date();
    const t1 = new Date(t0.getTime() + 5000);
    const s0 = makeSample({ estimatedLongitudinalAcceleration: -5, gpsSpeedKmh: 60, timestamp: t0 });
    const s1 = makeSample({ estimatedLongitudinalAcceleration: -5, gpsSpeedKmh: 60, timestamp: t1 });
    detector.detectFromSample(s0, null);
    const events = detector.detectFromSample(s1, s0);
    expect(events.some((e) => e.type === DrivingEventType.HARSH_BRAKING)).toBe(true);
  });
});

describe('enrichSample', () => {
  test('computes vehicle acceleration from GPS speed change', () => {
    const prev: SensorSample = { ...makeSample({ gpsSpeedKmh: 0, timestamp: new Date(1000) }) };
    const curr: SensorSample = { ...makeSample({ gpsSpeedKmh: 36, timestamp: new Date(2000) }) };
    const enriched = enrichSample(curr, prev);
    // 36 km/h = 10 m/s, over 1 second = 10 m/s²
    expect(enriched.estimatedVehicleAcceleration).toBeCloseTo(10, 0);
  });

  test('returns unchanged sample when prev is null', () => {
    const sample = makeSample({ gpsSpeedKmh: 50 });
    const enriched = enrichSample(sample, null);
    expect(enriched.gpsSpeedKmh).toBe(50);
  });

  test('computes accelMagnitude if missing', () => {
    const sample = makeSample({ accelX: 3, accelY: 4, accelZ: 0 });
    const enriched = enrichSample(sample, null);
    expect(enriched.accelMagnitude).toBeCloseTo(5, 1);
  });
});
