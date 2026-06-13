import { SensorMode, SensorPermissionStatus } from '@drivewise/shared';
import type { SensorSample } from '@drivewise/shared';
import type { SensorProvider, SensorProviderStatus, SensorAvailabilityMap } from '@drivewise/sensors';
import { generateTrip } from '@drivewise/simulation';
import type { ScenarioId } from '@drivewise/simulation';

const PLAYBACK_INTERVAL_MS = 200;

export class GeneratedSimulationSensorProvider implements SensorProvider {
  private callbacks: ((s: SensorSample) => void)[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private samples: SensorSample[] = [];
  private index = 0;
  private running = false;
  private samplesEmitted = 0;
  private lastSampleAt?: Date;

  constructor(private scenarioId: ScenarioId = 'safe_city') {}

  async start(): Promise<void> {
    const generated = generateTrip({ scenarioId: this.scenarioId, addNoise: true });
    this.samples = generated.samples;
    this.index = 0;
    this.running = true;

    this.timer = setInterval(() => {
      if (this.index >= this.samples.length) {
        this.index = 0; // loop
      }
      const sample = { ...this.samples[this.index], timestamp: new Date() };
      this.samplesEmitted++;
      this.lastSampleAt = sample.timestamp;
      this.callbacks.forEach((cb) => cb(sample));
      this.index++;
    }, PLAYBACK_INTERVAL_MS);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  subscribe(callback: (s: SensorSample) => void): () => void {
    this.callbacks.push(callback);
    return () => { this.callbacks = this.callbacks.filter((c) => c !== callback); };
  }

  getStatus(): SensorProviderStatus {
    return {
      mode: SensorMode.GENERATED_SIMULATION,
      isRunning: this.running,
      samplesEmitted: this.samplesEmitted,
      lastSampleAt: this.lastSampleAt,
      sensors: this.mockAvailability(),
    };
  }

  private mockAvailability(): SensorAvailabilityMap {
    const ok: import('@drivewise/sensors').SensorAvailability = {
      available: true,
      permission: SensorPermissionStatus.GRANTED,
      samplingRateHz: 5,
      lastSampleAt: this.lastSampleAt,
    };
    return { gps: ok, accelerometer: ok, gyroscope: ok, magnetometer: ok, barometer: ok, deviceMotion: ok };
  }
}
