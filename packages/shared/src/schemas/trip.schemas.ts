import { z } from 'zod';
import { TripMode } from '../types/enums';

export const StartTripSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  mode: z.nativeEnum(TripMode).default(TripMode.REAL_DEVICE),
});

export const TripPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  gpsSpeedKmh: z.number().min(0).max(400).optional(),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  timestamp: z.string().datetime(),
});

export const BatchTripPointsSchema = z.object({
  points: z.array(TripPointSchema).min(1).max(500),
});

export const SensorSampleSchema = z.object({
  timestamp: z.string().datetime(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  gpsSpeedKmh: z.number().optional(),
  gpsAccuracy: z.number().optional(),
  altitude: z.number().optional(),
  heading: z.number().optional(),
  accelX: z.number().optional(),
  accelY: z.number().optional(),
  accelZ: z.number().optional(),
  accelMagnitude: z.number().optional(),
  gyroX: z.number().optional(),
  gyroY: z.number().optional(),
  gyroZ: z.number().optional(),
  gyroMagnitude: z.number().optional(),
  rotationAlpha: z.number().optional(),
  rotationBeta: z.number().optional(),
  rotationGamma: z.number().optional(),
  userAccelerationX: z.number().optional(),
  userAccelerationY: z.number().optional(),
  userAccelerationZ: z.number().optional(),
  pressure: z.number().optional(),
  relativeAltitude: z.number().optional(),
  estimatedLongitudinalAcceleration: z.number().optional(),
  estimatedLateralAcceleration: z.number().optional(),
  detectedPhoneHandling: z.boolean().optional(),
  detectedDrivingState: z.string().optional(),
});

export const BatchSensorSamplesSchema = z.object({
  samples: z.array(SensorSampleSchema).min(1).max(1000),
});

export type StartTripDto = z.infer<typeof StartTripSchema>;
export type TripPointDto = z.infer<typeof TripPointSchema>;
export type BatchTripPointsDto = z.infer<typeof BatchTripPointsSchema>;
export type SensorSampleDto = z.infer<typeof SensorSampleSchema>;
export type BatchSensorSamplesDto = z.infer<typeof BatchSensorSamplesSchema>;
