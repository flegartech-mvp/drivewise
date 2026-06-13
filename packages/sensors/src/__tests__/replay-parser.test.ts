import { parseReplayJsonl, parseReplayCsv } from '../replay-parser';

const SAMPLE_JSONL = `
{"timestamp":"2024-01-15T09:00:00.000Z","lat":46.66,"lng":16.17,"speed":50,"accelX":0.2,"accelY":0.1,"accelZ":9.8}
{"timestamp":"2024-01-15T09:00:02.000Z","lat":46.661,"lng":16.171,"speed":52,"accelX":-4.5,"accelY":0.2,"accelZ":9.8,"longAccel":-4.5}
// This is a comment line — should be skipped
{"timestamp":"2024-01-15T09:00:04.000Z","lat":46.662,"lng":16.172,"speed":30}
`.trim();

const SAMPLE_CSV = `timestamp,lat,lng,speed,accelX,accelY,accelZ
2024-01-15T09:00:00.000Z,46.66,16.17,50,0.2,0.1,9.8
2024-01-15T09:00:02.000Z,46.661,16.171,52,-4.5,0.2,9.8
`;

describe('parseReplayJsonl', () => {
  test('parses valid JSONL into samples', () => {
    const samples = parseReplayJsonl(SAMPLE_JSONL);
    expect(samples).toHaveLength(3);
  });

  test('correctly maps lat/lng', () => {
    const samples = parseReplayJsonl(SAMPLE_JSONL);
    expect(samples[0].latitude).toBeCloseTo(46.66);
    expect(samples[0].longitude).toBeCloseTo(16.17);
  });

  test('correctly maps GPS speed', () => {
    const samples = parseReplayJsonl(SAMPLE_JSONL);
    expect(samples[0].gpsSpeedKmh).toBe(50);
  });

  test('sorts samples by timestamp ascending', () => {
    const reversed = `
{"timestamp":"2024-01-15T09:00:04.000Z","lat":46.662,"lng":16.172,"speed":30}
{"timestamp":"2024-01-15T09:00:00.000Z","lat":46.66,"lng":16.17,"speed":50}
`.trim();
    const samples = parseReplayJsonl(reversed);
    expect(samples[0].gpsSpeedKmh).toBe(50);
    expect(samples[1].gpsSpeedKmh).toBe(30);
  });

  test('skips comment lines', () => {
    const samples = parseReplayJsonl(SAMPLE_JSONL);
    expect(samples).toHaveLength(3); // 3 real lines, not 4
  });

  test('skips malformed JSON lines', () => {
    const withBad = SAMPLE_JSONL + '\n{bad json here\n';
    const samples = parseReplayJsonl(withBad);
    expect(samples).toHaveLength(3);
  });

  test('maps longitudinal acceleration', () => {
    const samples = parseReplayJsonl(SAMPLE_JSONL);
    expect(samples[1].estimatedLongitudinalAcceleration).toBe(-4.5);
  });
});

describe('parseReplayCsv', () => {
  test('parses CSV into samples', () => {
    const samples = parseReplayCsv(SAMPLE_CSV);
    expect(samples).toHaveLength(2);
  });

  test('maps lat/lng from CSV', () => {
    const samples = parseReplayCsv(SAMPLE_CSV);
    expect(samples[0].latitude).toBeCloseTo(46.66);
  });

  test('returns empty array for empty CSV', () => {
    const samples = parseReplayCsv('');
    expect(samples).toHaveLength(0);
  });
});
