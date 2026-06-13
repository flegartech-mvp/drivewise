import { SensorMode, SensorPermissionStatus } from '@drivewise/shared';
import type { SensorSample } from '@drivewise/shared';

export type { SensorSample };

export interface SensorProviderStatus {
  mode: SensorMode;
  isRunning: boolean;
  sensors: SensorAvailabilityMap;
  samplesEmitted: number;
  lastSampleAt?: Date;
  error?: string;
}

export interface SensorAvailability {
  available: boolean;
  permission: SensorPermissionStatus;
  samplingRateHz?: number;
  lastSampleAt?: Date;
  error?: string;
}

export type SensorAvailabilityMap = {
  gps: SensorAvailability;
  accelerometer: SensorAvailability;
  gyroscope: SensorAvailability;
  magnetometer: SensorAvailability;
  barometer: SensorAvailability;
  deviceMotion: SensorAvailability;
};

export interface SensorProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(callback: (sample: SensorSample) => void): () => void;
  getStatus(): SensorProviderStatus;
}

export interface DetectedEvent {
  type: import('@drivewise/shared').DrivingEventType;
  severity: import('@drivewise/shared').EventSeverity;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  value: number;
  metadata: Record<string, unknown>;
}
