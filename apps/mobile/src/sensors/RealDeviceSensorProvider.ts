import * as Location from 'expo-location';
import { Accelerometer, Gyroscope, Magnetometer, DeviceMotion } from 'expo-sensors';
import type { DeviceMotionMeasurement } from 'expo-sensors';
import { SensorMode, SensorPermissionStatus } from '@drivewise/shared';
import type { SensorSample } from '@drivewise/shared';
import type { SensorProvider, SensorProviderStatus, SensorAvailabilityMap } from '@drivewise/sensors';

const GPS_INTERVAL_MS = 2000;
const ACCEL_INTERVAL_MS = 100; // 10 Hz

export class RealDeviceSensorProvider implements SensorProvider {
  private callbacks: ((s: SensorSample) => void)[] = [];
  private subscriptions: { remove: () => void }[] = [];
  private latestLocation: Location.LocationObject | null = null;
  private latestAccel = { x: 0, y: 0, z: 0 };
  private latestGyro = { x: 0, y: 0, z: 0 };
  private latestMag = { x: 0, y: 0, z: 0 };
  private latestMotion: DeviceMotionMeasurement | null = null;
  private running = false;
  private samplesEmitted = 0;
  private lastSampleAt?: Date;

  async start(): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    this.running = true;

    // GPS subscription
    const locSub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: GPS_INTERVAL_MS, distanceInterval: 2 },
      (loc) => { this.latestLocation = loc; },
    );
    this.subscriptions.push({ remove: () => locSub.remove() });

    // Accelerometer
    Accelerometer.setUpdateInterval(ACCEL_INTERVAL_MS);
    const accelSub = Accelerometer.addListener((d) => { this.latestAccel = d; });
    this.subscriptions.push(accelSub);

    // Gyroscope
    Gyroscope.setUpdateInterval(ACCEL_INTERVAL_MS);
    const gyroSub = Gyroscope.addListener((d) => { this.latestGyro = d; });
    this.subscriptions.push(gyroSub);

    // Magnetometer
    Magnetometer.setUpdateInterval(500);
    const magSub = Magnetometer.addListener((d) => { this.latestMag = d; });
    this.subscriptions.push(magSub);

    // DeviceMotion (fused)
    DeviceMotion.setUpdateInterval(ACCEL_INTERVAL_MS);
    const motionSub = DeviceMotion.addListener((d) => {
      this.latestMotion = d;
      this.emitSample();
    });
    this.subscriptions.push(motionSub);
  }

  async stop(): Promise<void> {
    this.running = false;
    this.subscriptions.forEach((s) => s.remove());
    this.subscriptions = [];
  }

  subscribe(callback: (s: SensorSample) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== callback);
    };
  }

  getStatus(): SensorProviderStatus {
    return {
      mode: SensorMode.REAL_DEVICE,
      isRunning: this.running,
      samplesEmitted: this.samplesEmitted,
      lastSampleAt: this.lastSampleAt,
      sensors: this.buildAvailabilityMap(),
    };
  }

  private emitSample() {
    if (!this.running || this.callbacks.length === 0) return;

    const loc = this.latestLocation;
    const motion = this.latestMotion;
    const now = new Date();

    const sample: SensorSample = {
      timestamp: now,
      latitude: loc?.coords.latitude,
      longitude: loc?.coords.longitude,
      gpsSpeedKmh: loc?.coords.speed != null && loc.coords.speed >= 0
        ? loc.coords.speed * 3.6 : undefined,
      gpsAccuracy: loc?.coords.accuracy ?? undefined,
      altitude: loc?.coords.altitude ?? undefined,
      heading: loc?.coords.heading ?? undefined,
      accelX: this.latestAccel.x * 9.81,
      accelY: this.latestAccel.y * 9.81,
      accelZ: this.latestAccel.z * 9.81,
      accelMagnitude: Math.sqrt(
        (this.latestAccel.x * 9.81) ** 2 +
        (this.latestAccel.y * 9.81) ** 2 +
        (this.latestAccel.z * 9.81) ** 2,
      ),
      gyroX: this.latestGyro.x,
      gyroY: this.latestGyro.y,
      gyroZ: this.latestGyro.z,
      gyroMagnitude: Math.sqrt(
        this.latestGyro.x ** 2 + this.latestGyro.y ** 2 + this.latestGyro.z ** 2,
      ),
      magneticX: this.latestMag.x,
      magneticY: this.latestMag.y,
      magneticZ: this.latestMag.z,
      rotationAlpha: motion?.rotation?.alpha,
      rotationBeta: motion?.rotation?.beta,
      rotationGamma: motion?.rotation?.gamma,
      userAccelerationX: motion?.acceleration?.x != null ? motion.acceleration.x * 9.81 : undefined,
      userAccelerationY: motion?.acceleration?.y != null ? motion.acceleration.y * 9.81 : undefined,
      userAccelerationZ: motion?.acceleration?.z != null ? motion.acceleration.z * 9.81 : undefined,
    };

    this.samplesEmitted++;
    this.lastSampleAt = now;
    this.callbacks.forEach((cb) => cb(sample));
  }

  private buildAvailabilityMap(): SensorAvailabilityMap {
    const granted: import('@drivewise/sensors').SensorAvailability = {
      available: true,
      permission: SensorPermissionStatus.GRANTED,
      samplingRateHz: 10,
      lastSampleAt: this.lastSampleAt,
    };
    return {
      gps: granted,
      accelerometer: granted,
      gyroscope: granted,
      magnetometer: granted,
      barometer: { available: false, permission: SensorPermissionStatus.UNAVAILABLE },
      deviceMotion: granted,
    };
  }
}
