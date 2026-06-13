import type { SensorSample } from '@drivewise/shared';
import { RouteWaypoint, ROUTES } from './routes';
import { ScenarioId, SCENARIOS } from './scenarios';

const SAMPLE_INTERVAL_MS = 200; // 5 Hz sensor sampling

interface GenerationOptions {
  scenarioId: ScenarioId;
  startTime?: Date;
  /** Multiply real durations by this factor (default 1) */
  speedMultiplier?: number;
  addNoise?: boolean;
}

interface GeneratedTrip {
  scenarioId: ScenarioId;
  samples: SensorSample[];
  startedAt: Date;
  endedAt: Date;
  distanceKm: number;
}

export function generateTrip(options: GenerationOptions): GeneratedTrip {
  const scenario = SCENARIOS.find((s) => s.id === options.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${options.scenarioId}`);

  const route = ROUTES[scenario.routeKey];
  const startTime = options.startTime ?? new Date();

  const samples = buildSamples(
    scenario.id,
    route,
    startTime,
    scenario.durationSeconds,
    options.addNoise ?? true,
  );

  const lastSample = samples[samples.length - 1];
  const endedAt = lastSample?.timestamp ?? new Date(startTime.getTime() + scenario.durationSeconds * 1000);

  // Rough distance estimate
  let distanceKm = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (a.latitude && a.longitude && b.latitude && b.longitude) {
      const dlat = (b.latitude! - a.latitude!) * 111;
      const dlon = (b.longitude! - a.longitude!) * 111 * Math.cos((a.latitude! * Math.PI) / 180);
      distanceKm += Math.sqrt(dlat ** 2 + dlon ** 2);
    }
  }

  return { scenarioId: scenario.id, samples, startedAt: startTime, endedAt, distanceKm };
}

function buildSamples(
  scenarioId: ScenarioId,
  route: RouteWaypoint[],
  startTime: Date,
  durationSeconds: number,
  addNoise: boolean,
): SensorSample[] {
  const samples: SensorSample[] = [];
  const totalMs = durationSeconds * 1000;
  const steps = Math.floor(totalMs / SAMPLE_INTERVAL_MS);
  const segmentMs = totalMs / Math.max(1, route.length - 1);

  for (let i = 0; i < steps; i++) {
    const elapsed = i * SAMPLE_INTERVAL_MS;
    const t = elapsed / totalMs; // 0..1

    // Interpolate position between waypoints
    const segIdx = Math.min(
      route.length - 2,
      Math.floor(t * (route.length - 1)),
    );
    const segT = (t * (route.length - 1)) - segIdx;

    const wp1 = route[segIdx];
    const wp2 = route[Math.min(segIdx + 1, route.length - 1)];

    const lat = lerp(wp1.lat, wp2.lat, segT);
    const lng = lerp(wp1.lng, wp2.lng, segT);
    const baseLimitKmh = lerp(wp1.speedLimitKmh, wp2.speedLimitKmh, segT);

    const timestamp = new Date(startTime.getTime() + elapsed);
    const { speed, accelX, accelY, accelZ, gyroX, gyroY, gyroZ, phoneHandling } =
      buildSensorValues(scenarioId, t, baseLimitKmh, addNoise);

    const noise = addNoise ? (Math.random() - 0.5) * 0.00003 : 0;
    const gpsAccuracy = addNoise ? 4 + Math.random() * 8 : 5;

    // Simulate GPS signal loss for gps_signal_loss scenario
    const gpsLost =
      scenarioId === 'gps_signal_loss' &&
      ((t > 0.3 && t < 0.4) || (t > 0.65 && t < 0.72));

    const longAccel = computeLongitudinalAccel(accelX, accelY, accelZ);
    const latAccel = computeLateralAccel(accelX, accelY, accelZ);

    samples.push({
      timestamp,
      latitude: gpsLost ? undefined : lat + noise,
      longitude: gpsLost ? undefined : lng + noise,
      gpsSpeedKmh: gpsLost ? undefined : speed,
      gpsAccuracy: gpsLost ? undefined : gpsAccuracy,
      altitude: 200 + Math.sin(t * Math.PI) * 20,
      heading: computeHeading(route, segIdx, segT),
      accelX,
      accelY,
      accelZ,
      accelMagnitude: Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2),
      gyroX,
      gyroY,
      gyroZ,
      gyroMagnitude: Math.sqrt(gyroX ** 2 + gyroY ** 2 + gyroZ ** 2),
      estimatedLongitudinalAcceleration: longAccel,
      estimatedLateralAcceleration: latAccel,
      detectedPhoneHandling: phoneHandling,
      detectedDrivingState: speed > 5 ? 'DRIVING' : 'STOPPED',
    });
  }

  return samples;
}

function buildSensorValues(
  scenarioId: ScenarioId,
  t: number,
  limitKmh: number,
  noise: boolean,
): {
  speed: number;
  accelX: number; accelY: number; accelZ: number;
  gyroX: number; gyroY: number; gyroZ: number;
  phoneHandling: boolean;
} {
  const n = noise ? (Math.random() - 0.5) : 0;

  switch (scenarioId) {
    case 'safe_city':
    case 'safe_highway': {
      const speed = limitKmh * 0.92 + n * 3;
      return { speed, accelX: n * 0.3, accelY: n * 0.2, accelZ: 9.8 + n * 0.1, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: n * 0.05, phoneHandling: false };
    }
    case 'aggressive_driver': {
      const speed = limitKmh * 1.25 + n * 5;
      const brakingSpike = isSpikeTime(t, [0.2, 0.45, 0.7]) ? -8 : 0;
      return { speed, accelX: brakingSpike + n * 0.5, accelY: n * 0.5, accelZ: 9.8, gyroX: n * 0.2, gyroY: n * 0.2, gyroZ: isCornerTime(t) ? 1.2 : n * 0.1, phoneHandling: false };
    }
    case 'harsh_braking': {
      const speed = limitKmh * 0.9;
      const spike = isSpikeTime(t, [0.25, 0.5, 0.75]) ? -9 : n * 0.3;
      return { speed, accelX: spike, accelY: n * 0.2, accelZ: 9.8, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: n * 0.05, phoneHandling: false };
    }
    case 'harsh_acceleration': {
      const accel = isSpikeTime(t, [0.15, 0.4, 0.65]) ? 8 : n * 0.3;
      return { speed: limitKmh * 0.95, accelX: accel, accelY: n * 0.2, accelZ: 9.8, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: n * 0.05, phoneHandling: false };
    }
    case 'sharp_cornering': {
      const lat = isCornerTime(t) ? 4.5 : n * 0.2;
      return { speed: limitKmh * 1.0, accelX: n * 0.2, accelY: lat, accelZ: 9.8, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: isCornerTime(t) ? 1.5 : n * 0.05, phoneHandling: false };
    }
    case 'phone_movement': {
      const phoneActive = isSpikeTime(t, [0.3, 0.55, 0.8]);
      return { speed: limitKmh * 0.9, accelX: phoneActive ? 4 : n * 0.2, accelY: phoneActive ? 3 : n * 0.2, accelZ: 9.8, gyroX: phoneActive ? 2 : n * 0.05, gyroY: phoneActive ? 1.8 : n * 0.05, gyroZ: n * 0.1, phoneHandling: phoneActive };
    }
    case 'speeding': {
      const speed = limitKmh * 1.35 + n * 3;
      return { speed, accelX: n * 0.2, accelY: n * 0.2, accelZ: 9.8, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: n * 0.05, phoneHandling: false };
    }
    case 'stop_and_go': {
      const phase = (Math.sin(t * Math.PI * 8) + 1) / 2;
      const speed = phase * limitKmh * 0.7;
      return { speed, accelX: n * 0.3, accelY: n * 0.2, accelZ: 9.8, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: n * 0.05, phoneHandling: false };
    }
    case 'full_risk': {
      const speedFactor = isSpikeTime(t, [0.4, 0.6]) ? 1.3 : 1.0;
      const brakeSpike = isSpikeTime(t, [0.2, 0.5, 0.75]) ? -8 : 0;
      const phoneActive = isSpikeTime(t, [0.35]);
      return { speed: limitKmh * speedFactor, accelX: brakeSpike + n * 0.5, accelY: isCornerTime(t) ? 4.0 : n * 0.3, accelZ: 9.8, gyroX: n * 0.1, gyroY: n * 0.1, gyroZ: isCornerTime(t) ? 1.3 : n * 0.1, phoneHandling: phoneActive };
    }
    default: {
      return { speed: limitKmh * 0.9, accelX: n * 0.2, accelY: n * 0.2, accelZ: 9.8, gyroX: n * 0.05, gyroY: n * 0.05, gyroZ: n * 0.05, phoneHandling: false };
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function isSpikeTime(t: number, centers: number[], width = 0.03): boolean {
  return centers.some((c) => Math.abs(t - c) < width);
}

function isCornerTime(t: number): boolean {
  return isSpikeTime(t, [0.33, 0.66], 0.04);
}

function computeHeading(route: RouteWaypoint[], segIdx: number, _segT: number): number {
  const a = route[segIdx];
  const b = route[Math.min(segIdx + 1, route.length - 1)];
  const dLng = b.lng - a.lng;
  const dLat = b.lat - a.lat;
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

function computeLongitudinalAccel(x: number, y: number, z: number): number {
  // Use X as longitudinal (forward/back) — device orientation dependent
  return x;
}

function computeLateralAccel(x: number, y: number, z: number): number {
  return y;
}

/** Generate JSONL export of a simulated trip */
export function tripToJsonl(samples: SensorSample[]): string {
  return samples
    .map((s) =>
      JSON.stringify({
        timestamp: s.timestamp.toISOString(),
        lat: s.latitude,
        lng: s.longitude,
        speed: s.gpsSpeedKmh,
        accelX: s.accelX,
        accelY: s.accelY,
        accelZ: s.accelZ,
        gyroX: s.gyroX,
        gyroY: s.gyroY,
        gyroZ: s.gyroZ,
        heading: s.heading,
        accuracy: s.gpsAccuracy,
        drivingState: s.detectedDrivingState,
        phoneHandling: s.detectedPhoneHandling,
      }),
    )
    .join('\n');
}
