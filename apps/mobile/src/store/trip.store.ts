import { create } from 'zustand';
import { tripsApi } from '../api/client';
import { SensorMode } from '@drivewise/shared';
import type { SensorSample } from '@drivewise/shared';
import { EventDetector, enrichSample } from '@drivewise/sensors';
import type { DetectedEvent } from '@drivewise/sensors';
import type { SensorProvider } from '@drivewise/sensors';

const UPLOAD_BATCH_MS = 15000;  // upload every 15s
const GPS_BUFFER_MAX = 200;

interface TripState {
  isActive: boolean;
  tripId: string | null;
  startedAt: Date | null;
  distanceKm: number;
  currentSpeedKmh: number;
  recentEvents: DetectedEvent[];
  sensorMode: SensorMode;
  sensorProvider: SensorProvider | null;
  liveScore: number;

  startTrip: (vehicleId: string | undefined, provider: SensorProvider, mode: SensorMode) => Promise<void>;
  stopTrip: () => Promise<{ finalScore: number; tripId: string } | null>;
  setSensorMode: (mode: SensorMode) => void;
}

let gpsBuffer: SensorSample[] = [];
let sampleBuffer: SensorSample[] = [];
let uploadTimer: ReturnType<typeof setInterval> | null = null;
let sensorUnsub: (() => void) | null = null;
const detector = new EventDetector();
let prevSample: SensorSample | null = null;

export const useTripStore = create<TripState>((set, get) => ({
  isActive: false,
  tripId: null,
  startedAt: null,
  distanceKm: 0,
  currentSpeedKmh: 0,
  recentEvents: [],
  sensorMode: SensorMode.GENERATED_SIMULATION,
  sensorProvider: null,
  liveScore: 100,

  setSensorMode: (mode) => set({ sensorMode: mode }),

  startTrip: async (vehicleId, provider, mode) => {
    const res = await tripsApi.start(vehicleId, mode);
    const tripId = res.data.id;

    gpsBuffer = [];
    sampleBuffer = [];
    detector.reset();
    prevSample = null;

    set({ isActive: true, tripId, startedAt: new Date(), distanceKm: 0, recentEvents: [], sensorProvider: provider });

    await provider.start();

    sensorUnsub = provider.subscribe((sample) => {
      const enriched = enrichSample(sample, prevSample);
      prevSample = enriched;

      if (enriched.latitude && enriched.longitude) {
        gpsBuffer.push(enriched);
      }
      sampleBuffer.push(enriched);

      const events = detector.detectFromSample(enriched, prevSample);
      if (events.length > 0) {
        set((s) => ({
          recentEvents: [...events, ...s.recentEvents].slice(0, 20),
          liveScore: Math.max(0, s.liveScore - events.length * 2),
        }));
      }

      set({ currentSpeedKmh: enriched.gpsSpeedKmh ?? 0 });
    });

    uploadTimer = setInterval(async () => {
      await flushBuffers(tripId);
    }, UPLOAD_BATCH_MS);
  },

  stopTrip: async () => {
    const { tripId, sensorProvider } = get();
    if (!tripId) return null;

    if (uploadTimer) { clearInterval(uploadTimer); uploadTimer = null; }
    if (sensorUnsub) { sensorUnsub(); sensorUnsub = null; }
    if (sensorProvider) await sensorProvider.stop();

    await flushBuffers(tripId);

    const res = await tripsApi.finish(tripId);
    const finalScore = res.data.trip?.score ?? res.data.score?.finalScore ?? 0;

    set({ isActive: false, tripId: null, startedAt: null, sensorProvider: null });
    return { finalScore, tripId };
  },
}));

async function flushBuffers(tripId: string) {
  if (gpsBuffer.length > 0) {
    const pts = gpsBuffer.splice(0, GPS_BUFFER_MAX).map((s) => ({
      latitude: s.latitude!,
      longitude: s.longitude!,
      gpsSpeedKmh: s.gpsSpeedKmh,
      altitude: s.altitude,
      heading: s.heading,
      accuracy: s.gpsAccuracy,
      timestamp: s.timestamp.toISOString(),
    }));
    try { await tripsApi.addPointsBatch(tripId, pts); } catch {}
  }

  if (sampleBuffer.length > 0) {
    const samples = sampleBuffer.splice(0, 500).map((s) => ({
      ...s,
      timestamp: s.timestamp.toISOString(),
      id: undefined,
      tripId: undefined,
    }));
    try { await tripsApi.addSamplesBatch(tripId, samples); } catch {}
  }
}
