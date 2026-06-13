import {
  UserRole, VehicleType, TripStatus, TripMode,
  DrivingEventType, EventSeverity, RewardTier,
  SpeedLimitConfidence, SpeedLimitSource, RoadSegmentSource,
  ImportStatus,
} from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  userId: string;
  plateNumber?: string;
  vehicleType: VehicleType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  userId: string;
  vehicleId?: string;
  startedAt: Date;
  endedAt?: Date;
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  score?: number;
  status: TripStatus;
  mode: TripMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripPoint {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  gpsSpeedKmh?: number;
  altitude?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
  matchedRoadSegmentId?: string;
  speedLimitKmh?: number;
  speedLimitSource?: SpeedLimitSource;
  speedLimitConfidence?: SpeedLimitConfidence;
}

export interface SensorSample {
  id?: string;
  tripId?: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  gpsSpeedKmh?: number;
  gpsAccuracy?: number;
  altitude?: number;
  heading?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  accelMagnitude?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  gyroMagnitude?: number;
  rotationAlpha?: number;
  rotationBeta?: number;
  rotationGamma?: number;
  userAccelerationX?: number;
  userAccelerationY?: number;
  userAccelerationZ?: number;
  magneticX?: number;
  magneticY?: number;
  magneticZ?: number;
  pressure?: number;
  relativeAltitude?: number;
  estimatedVehicleAcceleration?: number;
  estimatedLongitudinalAcceleration?: number;
  estimatedLateralAcceleration?: number;
  detectedPhoneHandling?: boolean;
  detectedDrivingState?: string;
  rawPayload?: Record<string, unknown>;
}

export interface DrivingEvent {
  id: string;
  tripId: string;
  type: DrivingEventType;
  severity: EventSeverity;
  latitude?: number;
  longitude?: number;
  value?: number;
  timestamp: Date;
  metadata: DrivingEventMetadata;
  createdAt: Date;
}

export interface DrivingEventMetadata {
  speedKmh?: number;
  speedLimitKmh?: number;
  speedLimitSource?: SpeedLimitSource;
  speedLimitConfidence?: SpeedLimitConfidence;
  roadSegmentId?: string;
  weatherCondition?: string;
  nearbyTrafficEventId?: string;
  accelerationValue?: number;
  lateralAcceleration?: number;
  gyroMagnitude?: number;
  isExperimental?: boolean;
  [key: string]: unknown;
}

export interface Reward {
  id: string;
  userId: string;
  month: string;
  score: number;
  distanceKm: number;
  tier: RewardTier;
  simulatedDiscountPercent: number;
  createdAt: Date;
}

export interface RoadSegment {
  id: string;
  source: RoadSegmentSource;
  osmId: string;
  name?: string;
  roadType?: string;
  geometry: GeoJsonLineString;
  maxSpeedKmh?: number;
  city?: string;
  country: string;
  rawTags: Record<string, unknown>;
  importedAt: Date;
  updatedAt: Date;
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface TrafficEvent {
  id: string;
  source: string;
  externalId?: string;
  type: string;
  title: string;
  description?: string;
  severity?: string;
  latitude?: number;
  longitude?: number;
  roadName?: string;
  validFrom?: Date;
  validTo?: Date;
  rawPayload: Record<string, unknown>;
  importedAt: Date;
}

export interface WeatherSnapshot {
  id: string;
  source: string;
  latitude: number;
  longitude: number;
  temperature?: number;
  rain?: number;
  snow?: number;
  fog?: number;
  windSpeed?: number;
  visibility?: number;
  condition?: string;
  timestamp: Date;
  rawPayload: Record<string, unknown>;
}

export interface DataImportLog {
  id: string;
  provider: string;
  status: ImportStatus;
  startedAt: Date;
  finishedAt?: Date;
  recordsImported: number;
  errorMessage?: string;
}

export interface ApiProviderStatus {
  provider: string;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  status: 'OK' | 'ERROR' | 'UNKNOWN';
  message?: string;
}
