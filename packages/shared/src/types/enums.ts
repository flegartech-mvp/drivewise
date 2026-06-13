export enum UserRole {
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  VAN = 'VAN',
}

export enum TripStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TripMode {
  REAL_DEVICE = 'REAL_DEVICE',
  REPLAY_FILE = 'REPLAY_FILE',
  GENERATED_SIMULATION = 'GENERATED_SIMULATION',
}

export enum DrivingEventType {
  SPEEDING = 'SPEEDING',
  HARSH_BRAKING = 'HARSH_BRAKING',
  HARSH_ACCELERATION = 'HARSH_ACCELERATION',
  SHARP_CORNERING = 'SHARP_CORNERING',
  PHONE_MOVEMENT = 'PHONE_MOVEMENT',
  NIGHT_DRIVING = 'NIGHT_DRIVING',
  GPS_SIGNAL_LOSS = 'GPS_SIGNAL_LOSS',
  CRASH_LIKE_SPIKE = 'CRASH_LIKE_SPIKE',
}

export enum EventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RewardTier {
  NONE = 'NONE',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum SpeedLimitConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  UNKNOWN = 'UNKNOWN',
}

export enum SpeedLimitSource {
  OSM_MAXSPEED = 'OSM_MAXSPEED',
  ROAD_TYPE_FALLBACK = 'ROAD_TYPE_FALLBACK',
  MANUAL = 'MANUAL',
  UNKNOWN = 'UNKNOWN',
}

export enum RoadSegmentSource {
  OSM = 'OSM',
}

export enum ImportStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export enum SensorMode {
  REAL_DEVICE = 'REAL_DEVICE',
  REPLAY_FILE = 'REPLAY_FILE',
  GENERATED_SIMULATION = 'GENERATED_SIMULATION',
}

export enum SensorPermissionStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  UNDETERMINED = 'UNDETERMINED',
  UNAVAILABLE = 'UNAVAILABLE',
}
