import { generateTrip, tripToJsonl } from '../generator';
import { SCENARIOS } from '../scenarios';

describe('generateTrip', () => {
  test('generates samples for safe_city scenario', () => {
    const result = generateTrip({ scenarioId: 'safe_city', addNoise: false });
    expect(result.samples.length).toBeGreaterThan(100);
    expect(result.startedAt).toBeInstanceOf(Date);
    expect(result.endedAt).toBeInstanceOf(Date);
    expect(result.endedAt.getTime()).toBeGreaterThan(result.startedAt.getTime());
  });

  test('generates samples for aggressive_driver scenario', () => {
    const result = generateTrip({ scenarioId: 'aggressive_driver', addNoise: false });
    expect(result.samples.length).toBeGreaterThan(50);
  });

  test('all samples have timestamps', () => {
    const result = generateTrip({ scenarioId: 'safe_city', addNoise: false });
    for (const s of result.samples) {
      expect(s.timestamp).toBeInstanceOf(Date);
    }
  });

  test('samples have GPS coordinates', () => {
    const result = generateTrip({ scenarioId: 'safe_city', addNoise: false });
    const withGps = result.samples.filter((s) => s.latitude && s.longitude);
    expect(withGps.length).toBeGreaterThan(50);
  });

  test('GPS loss scenario has some samples without coordinates', () => {
    const result = generateTrip({ scenarioId: 'gps_signal_loss', addNoise: false });
    const missing = result.samples.filter((s) => !s.latitude || !s.longitude);
    expect(missing.length).toBeGreaterThan(0);
  });

  test('calculates non-zero distanceKm', () => {
    const result = generateTrip({ scenarioId: 'safe_highway', addNoise: false });
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  test('all defined scenarios generate successfully', () => {
    for (const scenario of SCENARIOS) {
      const result = generateTrip({ scenarioId: scenario.id, addNoise: false });
      expect(result.samples.length).toBeGreaterThan(0);
    }
  });

  test('uses custom startTime', () => {
    const custom = new Date('2024-06-01T06:00:00Z');
    const result = generateTrip({ scenarioId: 'safe_city', startTime: custom, addNoise: false });
    expect(result.startedAt.toISOString()).toBe(custom.toISOString());
  });
});

describe('tripToJsonl', () => {
  test('produces valid JSONL', () => {
    const result = generateTrip({ scenarioId: 'safe_city', addNoise: false });
    const jsonl = tripToJsonl(result.samples.slice(0, 5));
    const lines = jsonl.split('\n').filter(Boolean);
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  test('JSONL lines contain timestamp field', () => {
    const result = generateTrip({ scenarioId: 'safe_city', addNoise: false });
    const jsonl = tripToJsonl(result.samples.slice(0, 3));
    const lines = jsonl.split('\n').filter(Boolean);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.timestamp).toBeDefined();
  });
});
