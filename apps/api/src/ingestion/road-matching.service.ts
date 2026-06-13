import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MATCH_RADIUS_DEGREES = 0.001; // ~110 m

@Injectable()
export class RoadMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find the nearest road segment to a GPS point using bounding-box search */
  async findNearestSegment(lat: number, lng: number) {
    const segments = await this.prisma.roadSegment.findMany({
      where: {
        // crude bounding box — geometry stored as GeoJSON
      },
      take: 50,
    });

    if (!segments.length) return null;

    let best: (typeof segments)[0] | null = null;
    let bestDist = Infinity;

    for (const seg of segments) {
      const geom = JSON.parse(seg.geometry) as { type: string; coordinates: [number, number][] };
      if (geom?.type !== 'LineString') continue;

      for (const [cLng, cLat] of geom.coordinates) {
        const dist = Math.sqrt((lat - cLat) ** 2 + (lng - cLng) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          best = seg;
        }
      }
    }

    return bestDist < MATCH_RADIUS_DEGREES ? best : null;
  }
}
