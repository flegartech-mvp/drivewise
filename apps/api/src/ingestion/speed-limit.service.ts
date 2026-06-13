import { Injectable } from '@nestjs/common';
import { RoadMatchingService } from './road-matching.service';
import { SpeedLimitConfidence, SpeedLimitSource } from '@drivewise/shared';

export interface SpeedLimitResult {
  speedLimitKmh: number | null;
  confidence: SpeedLimitConfidence;
  source: SpeedLimitSource;
  matchedRoadSegmentId?: string;
}

const ROAD_TYPE_FALLBACKS: Record<string, number> = {
  motorway: 130,
  motorway_link: 80,
  trunk: 90,
  trunk_link: 70,
  primary: 90,
  primary_link: 50,
  secondary: 90,
  secondary_link: 50,
  tertiary: 50,
  tertiary_link: 50,
  residential: 50,
  living_street: 10,
  service: 30,
  unclassified: 50,
  track: 30,
};

@Injectable()
export class SpeedLimitService {
  constructor(private readonly roadMatching: RoadMatchingService) {}

  async getSpeedLimit(lat: number, lng: number): Promise<SpeedLimitResult> {
    const seg = await this.roadMatching.findNearestSegment(lat, lng);

    if (!seg) {
      return {
        speedLimitKmh: null,
        confidence: SpeedLimitConfidence.UNKNOWN,
        source: SpeedLimitSource.UNKNOWN,
      };
    }

    if (seg.maxSpeedKmh) {
      return {
        speedLimitKmh: seg.maxSpeedKmh,
        confidence: SpeedLimitConfidence.HIGH,
        source: SpeedLimitSource.OSM_MAXSPEED,
        matchedRoadSegmentId: seg.id,
      };
    }

    const fallback = seg.roadType ? ROAD_TYPE_FALLBACKS[seg.roadType] ?? null : null;
    if (fallback) {
      return {
        speedLimitKmh: fallback,
        confidence: SpeedLimitConfidence.LOW,
        source: SpeedLimitSource.ROAD_TYPE_FALLBACK,
        matchedRoadSegmentId: seg.id,
      };
    }

    return {
      speedLimitKmh: null,
      confidence: SpeedLimitConfidence.UNKNOWN,
      source: SpeedLimitSource.UNKNOWN,
      matchedRoadSegmentId: seg.id,
    };
  }
}
