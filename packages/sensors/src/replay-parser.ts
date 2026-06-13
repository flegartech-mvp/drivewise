import type { SensorSample } from '@drivewise/shared';

/** Parse a JSONL replay file into an array of SensorSamples */
export function parseReplayJsonl(content: string): SensorSample[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//'));

  const samples: SensorSample[] = [];

  for (const line of lines) {
    try {
      const raw = JSON.parse(line);
      samples.push(mapRawToSample(raw));
    } catch {
      // Skip malformed lines
    }
  }

  return samples.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/** Parse CSV replay file */
export function parseReplayCsv(content: string): SensorSample[] {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const samples: SensorSample[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? '';
    });

    try {
      samples.push(mapRawToSample({
        timestamp: row['timestamp'],
        lat: row['lat'] || row['latitude'],
        lng: row['lng'] || row['longitude'],
        speed: row['speed'] || row['gpsSpeedKmh'],
        accelX: row['accelx'] || row['accel_x'],
        accelY: row['accely'] || row['accel_y'],
        accelZ: row['accelz'] || row['accel_z'],
        gyroX: row['gyrox'] || row['gyro_x'],
        gyroY: row['gyroy'] || row['gyro_y'],
        gyroZ: row['gyroz'] || row['gyro_z'],
        heading: row['heading'],
        accuracy: row['accuracy'],
      }));
    } catch {
      // Skip malformed rows
    }
  }

  return samples.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function mapRawToSample(raw: Record<string, unknown>): SensorSample {
  const ts = raw['timestamp'] as string | number;
  const timestamp = typeof ts === 'number'
    ? new Date(ts)
    : new Date(ts as string);

  if (isNaN(timestamp.getTime())) {
    throw new Error(`Invalid timestamp: ${ts}`);
  }

  return {
    timestamp,
    latitude: parseOptFloat(raw['lat'] ?? raw['latitude']),
    longitude: parseOptFloat(raw['lng'] ?? raw['longitude']),
    gpsSpeedKmh: parseOptFloat(raw['speed'] ?? raw['gpsSpeedKmh'] ?? raw['gps_speed']),
    gpsAccuracy: parseOptFloat(raw['accuracy'] ?? raw['gpsAccuracy']),
    altitude: parseOptFloat(raw['altitude'] ?? raw['alt']),
    heading: parseOptFloat(raw['heading']),
    accelX: parseOptFloat(raw['accelX'] ?? raw['accel_x']),
    accelY: parseOptFloat(raw['accelY'] ?? raw['accel_y']),
    accelZ: parseOptFloat(raw['accelZ'] ?? raw['accel_z']),
    gyroX: parseOptFloat(raw['gyroX'] ?? raw['gyro_x']),
    gyroY: parseOptFloat(raw['gyroY'] ?? raw['gyro_y']),
    gyroZ: parseOptFloat(raw['gyroZ'] ?? raw['gyro_z']),
    estimatedLongitudinalAcceleration: parseOptFloat(raw['longAccel'] ?? raw['longitudinalAcceleration']),
    estimatedLateralAcceleration: parseOptFloat(raw['latAccel'] ?? raw['lateralAcceleration']),
    detectedPhoneHandling: raw['phoneHandling'] === true || raw['phoneHandling'] === 'true',
    detectedDrivingState: raw['drivingState'] as string | undefined,
  };
}

function parseOptFloat(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}
