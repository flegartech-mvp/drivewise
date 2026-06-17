-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DRIVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plateNumber" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT 'CAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "averageSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mode" TEXT NOT NULL DEFAULT 'REAL_DEVICE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPoint" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "gpsSpeedKmh" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "matchedRoadSegmentId" TEXT,
    "speedLimitKmh" DOUBLE PRECISION,
    "speedLimitSource" TEXT,
    "speedLimitConfidence" TEXT,

    CONSTRAINT "TripPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorSample" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "gpsSpeedKmh" DOUBLE PRECISION,
    "gpsAccuracy" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accelX" DOUBLE PRECISION,
    "accelY" DOUBLE PRECISION,
    "accelZ" DOUBLE PRECISION,
    "accelMagnitude" DOUBLE PRECISION,
    "gyroX" DOUBLE PRECISION,
    "gyroY" DOUBLE PRECISION,
    "gyroZ" DOUBLE PRECISION,
    "gyroMagnitude" DOUBLE PRECISION,
    "rotationAlpha" DOUBLE PRECISION,
    "rotationBeta" DOUBLE PRECISION,
    "rotationGamma" DOUBLE PRECISION,
    "userAccelerationX" DOUBLE PRECISION,
    "userAccelerationY" DOUBLE PRECISION,
    "userAccelerationZ" DOUBLE PRECISION,
    "magneticX" DOUBLE PRECISION,
    "magneticY" DOUBLE PRECISION,
    "magneticZ" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "relativeAltitude" DOUBLE PRECISION,
    "estimatedVehicleAcceleration" DOUBLE PRECISION,
    "estimatedLongitudinalAcceleration" DOUBLE PRECISION,
    "estimatedLateralAcceleration" DOUBLE PRECISION,
    "detectedPhoneHandling" BOOLEAN NOT NULL DEFAULT false,
    "detectedDrivingState" TEXT,
    "rawPayload" TEXT,

    CONSTRAINT "SensorSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrivingEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "value" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrivingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'NONE',
    "simulatedDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadSegment" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OSM',
    "osmId" TEXT NOT NULL,
    "name" TEXT,
    "roadType" TEXT,
    "geometry" TEXT NOT NULL,
    "maxSpeedKmh" DOUBLE PRECISION,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SI',
    "rawTags" TEXT NOT NULL DEFAULT '{}',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "roadName" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "rawPayload" TEXT NOT NULL DEFAULT '{}',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherSnapshot" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION,
    "rain" DOUBLE PRECISION,
    "snow" DOUBLE PRECISION,
    "fog" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "visibility" DOUBLE PRECISION,
    "condition" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "rawPayload" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "WeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImportLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "recordsImported" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "DataImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiProviderStatus" (
    "provider" TEXT NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "message" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiProviderStatus_pkey" PRIMARY KEY ("provider")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TripPoint_tripId_idx" ON "TripPoint"("tripId");

-- CreateIndex
CREATE INDEX "TripPoint_timestamp_idx" ON "TripPoint"("timestamp");

-- CreateIndex
CREATE INDEX "SensorSample_tripId_idx" ON "SensorSample"("tripId");

-- CreateIndex
CREATE INDEX "SensorSample_timestamp_idx" ON "SensorSample"("timestamp");

-- CreateIndex
CREATE INDEX "DrivingEvent_tripId_idx" ON "DrivingEvent"("tripId");

-- CreateIndex
CREATE INDEX "DrivingEvent_type_idx" ON "DrivingEvent"("type");

-- CreateIndex
CREATE INDEX "DrivingEvent_timestamp_idx" ON "DrivingEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_userId_month_key" ON "Reward"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RoadSegment_osmId_key" ON "RoadSegment"("osmId");

-- CreateIndex
CREATE INDEX "RoadSegment_roadType_idx" ON "RoadSegment"("roadType");

-- CreateIndex
CREATE INDEX "TrafficEvent_type_idx" ON "TrafficEvent"("type");

-- CreateIndex
CREATE INDEX "TrafficEvent_importedAt_idx" ON "TrafficEvent"("importedAt");

-- CreateIndex
CREATE INDEX "WeatherSnapshot_timestamp_idx" ON "WeatherSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "DataImportLog_provider_idx" ON "DataImportLog"("provider");

-- CreateIndex
CREATE INDEX "DataImportLog_startedAt_idx" ON "DataImportLog"("startedAt");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPoint" ADD CONSTRAINT "TripPoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorSample" ADD CONSTRAINT "SensorSample_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingEvent" ADD CONSTRAINT "DrivingEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
