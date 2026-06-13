import { DrivingEventType, EventSeverity, SpeedLimitConfidence } from '@drivewise/shared';
import type { SensorSample } from '@drivewise/shared';
import { DetectedEvent } from './types';

// ── Thresholds ──────────────────────────────────────────────────────────────

const HARSH_BRAKING_THRESHOLD = -3.0;        // m/s²
const HARSH_ACCEL_THRESHOLD = 3.0;           // m/s²
const SHARP_CORNERING_THRESHOLD = 2.5;       // m/s² lateral
const PHONE_GYRO_THRESHOLD = 1.5;            // rad/s magnitude
const PHONE_ACCEL_THRESHOLD = 3.0;           // m/s² magnitude
const CRASH_SPIKE_THRESHOLD = 30.0;          // m/s²
const MIN_SPEED_FOR_EVENT_KMH = 10;          // do not flag events at very low speed
const DEBOUNCE_MS = 3000;                    // ms between same-type events

interface DetectorState {
  lastEventTime: Partial<Record<DrivingEventType, number>>;
}

export class EventDetector {
  private state: DetectorState = { lastEventTime: {} };

  reset(): void {
    this.state = { lastEventTime: {} };
  }

  detectFromSample(
    sample: SensorSample,
    prev: SensorSample | null,
    speedLimitKmh?: number,
    speedLimitConfidence?: SpeedLimitConfidence,
  ): DetectedEvent[] {
    const events: DetectedEvent[] = [];
    const now = sample.timestamp.getTime();
    const speed = sample.gpsSpeedKmh ?? 0;

    // ── Harsh braking ─────────────────────────────────────────────────────
    if (
      speed >= MIN_SPEED_FOR_EVENT_KMH &&
      (sample.estimatedLongitudinalAcceleration ?? 0) < HARSH_BRAKING_THRESHOLD
    ) {
      const val = sample.estimatedLongitudinalAcceleration!;
      if (this.debounce(DrivingEventType.HARSH_BRAKING, now)) {
        events.push({
          type: DrivingEventType.HARSH_BRAKING,
          severity: val < -6 ? EventSeverity.HIGH : val < -4.5 ? EventSeverity.MEDIUM : EventSeverity.LOW,
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          value: Math.abs(val),
          metadata: { longitudinalAcceleration: val, speedKmh: speed },
        });
      }
    }

    // ── Harsh acceleration ────────────────────────────────────────────────
    if (
      speed >= MIN_SPEED_FOR_EVENT_KMH &&
      (sample.estimatedLongitudinalAcceleration ?? 0) > HARSH_ACCEL_THRESHOLD
    ) {
      const val = sample.estimatedLongitudinalAcceleration!;
      if (this.debounce(DrivingEventType.HARSH_ACCELERATION, now)) {
        events.push({
          type: DrivingEventType.HARSH_ACCELERATION,
          severity: val > 6 ? EventSeverity.HIGH : val > 4.5 ? EventSeverity.MEDIUM : EventSeverity.LOW,
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          value: val,
          metadata: { longitudinalAcceleration: val, speedKmh: speed },
        });
      }
    }

    // ── Sharp cornering ───────────────────────────────────────────────────
    if (
      speed >= MIN_SPEED_FOR_EVENT_KMH &&
      Math.abs(sample.estimatedLateralAcceleration ?? 0) > SHARP_CORNERING_THRESHOLD
    ) {
      const val = sample.estimatedLateralAcceleration!;
      if (this.debounce(DrivingEventType.SHARP_CORNERING, now)) {
        const absVal = Math.abs(val);
        events.push({
          type: DrivingEventType.SHARP_CORNERING,
          severity: absVal > 5 ? EventSeverity.HIGH : absVal > 3.5 ? EventSeverity.MEDIUM : EventSeverity.LOW,
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          value: absVal,
          metadata: { lateralAcceleration: val, speedKmh: speed, direction: val > 0 ? 'right' : 'left' },
        });
      }
    }

    // ── Possible phone movement ───────────────────────────────────────────
    if (speed >= MIN_SPEED_FOR_EVENT_KMH) {
      const gyroMag = sample.gyroMagnitude ?? magnitude(sample.gyroX, sample.gyroY, sample.gyroZ);
      const accelMag = sample.accelMagnitude ?? magnitude(sample.accelX, sample.accelY, sample.accelZ);
      if (gyroMag > PHONE_GYRO_THRESHOLD && accelMag > PHONE_ACCEL_THRESHOLD) {
        if (this.debounce(DrivingEventType.PHONE_MOVEMENT, now)) {
          events.push({
            type: DrivingEventType.PHONE_MOVEMENT,
            severity: EventSeverity.MEDIUM,
            timestamp: sample.timestamp,
            latitude: sample.latitude,
            longitude: sample.longitude,
            value: gyroMag,
            metadata: {
              gyroMagnitude: gyroMag,
              accelMagnitude: accelMag,
              speedKmh: speed,
              note: 'Possible phone movement — estimate only',
            },
          });
        }
      }
    }

    // ── Speeding ──────────────────────────────────────────────────────────
    if (speedLimitKmh && speed > speedLimitKmh && speed >= MIN_SPEED_FOR_EVENT_KMH) {
      const excess = speed - speedLimitKmh;
      if (this.debounce(DrivingEventType.SPEEDING, now)) {
        const severity = excess >= 20
          ? EventSeverity.HIGH
          : excess >= 10
            ? EventSeverity.MEDIUM
            : EventSeverity.LOW;
        events.push({
          type: DrivingEventType.SPEEDING,
          severity,
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          value: excess,
          metadata: {
            speedKmh: speed,
            speedLimitKmh,
            speedLimitConfidence,
            excessKmh: excess,
          },
        });
      }
    }

    // ── Crash-like spike (experimental) ──────────────────────────────────
    const totalAccel = magnitude(sample.accelX, sample.accelY, sample.accelZ);
    if (totalAccel > CRASH_SPIKE_THRESHOLD) {
      if (this.debounce(DrivingEventType.CRASH_LIKE_SPIKE, now)) {
        events.push({
          type: DrivingEventType.CRASH_LIKE_SPIKE,
          severity: EventSeverity.HIGH,
          timestamp: sample.timestamp,
          latitude: sample.latitude,
          longitude: sample.longitude,
          value: totalAccel,
          metadata: {
            accelMagnitude: totalAccel,
            isExperimental: true,
            note: 'Experimental crash-like spike detection — not a confirmed crash',
          },
        });
      }
    }

    return events;
  }

  private debounce(type: DrivingEventType, now: number): boolean {
    const last = this.state.lastEventTime[type] ?? 0;
    if (now - last < DEBOUNCE_MS) return false;
    this.state.lastEventTime[type] = now;
    return true;
  }
}

function magnitude(x?: number, y?: number, z?: number): number {
  return Math.sqrt((x ?? 0) ** 2 + (y ?? 0) ** 2 + (z ?? 0) ** 2);
}

/** Enrich a SensorSample with computed magnitudes and estimated accelerations */
export function enrichSample(sample: SensorSample, prev: SensorSample | null): SensorSample {
  const base: SensorSample = {
    ...sample,
    accelMagnitude:
      sample.accelMagnitude ??
      Math.sqrt((sample.accelX ?? 0) ** 2 + (sample.accelY ?? 0) ** 2 + (sample.accelZ ?? 0) ** 2),
    gyroMagnitude:
      sample.gyroMagnitude ??
      Math.sqrt((sample.gyroX ?? 0) ** 2 + (sample.gyroY ?? 0) ** 2 + (sample.gyroZ ?? 0) ** 2),
  };

  if (!prev) return base;

  const dtMs = base.timestamp.getTime() - prev.timestamp.getTime();
  if (dtMs <= 0 || dtMs > 5000) return base;

  const dtS = dtMs / 1000;
  const speedNow = (base.gpsSpeedKmh ?? 0) / 3.6;
  const speedPrev = (prev.gpsSpeedKmh ?? 0) / 3.6;
  const vehicleAccel = (speedNow - speedPrev) / dtS;

  return {
    ...base,
    estimatedVehicleAcceleration: vehicleAccel,
    estimatedLongitudinalAcceleration: base.estimatedLongitudinalAcceleration ?? vehicleAccel,
    estimatedLateralAcceleration: base.estimatedLateralAcceleration ?? base.userAccelerationY,
  };
}
