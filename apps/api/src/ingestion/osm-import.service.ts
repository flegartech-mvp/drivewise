import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  nodes?: number[];
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const DEMO_BBOXES: Record<string, string> = {
  murska_sobota: '46.64,16.14,46.69,16.20',
  ljubljana: '46.03,14.48,46.09,14.54',
  maribor: '46.54,15.62,46.58,15.68',
  celje: '46.22,15.25,46.25,15.30',
};

@Injectable()
export class OsmImportService {
  private readonly logger = new Logger(OsmImportService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async importArea(areaKey: keyof typeof DEMO_BBOXES): Promise<{ imported: number; errors: number }> {
    const bbox = DEMO_BBOXES[areaKey];
    if (!bbox) throw new Error(`Unknown area: ${areaKey}`);

    await this.logStart('OSM_OVERPASS');

    const overpassUrl = this.config.get<string>(
      'OVERPASS_API_URL',
      'https://overpass-api.de/api/interpreter',
    );

    const query = `[out:json][timeout:30];
way["highway"](${bbox});
out body geom;`;

    let elements: OverpassElement[] = [];
    try {
      const res = await axios.post<OverpassResponse>(
        overpassUrl,
        `data=${encodeURIComponent(query)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 35000 },
      );
      elements = res.data?.elements ?? [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Overpass fetch failed: ${msg} — skipping live import`);
      await this.logFinish('OSM_OVERPASS', 'FAILED', 0, msg);
      return { imported: 0, errors: 1 };
    }

    let imported = 0;
    let errors = 0;

    for (const el of elements) {
      if (el.type !== 'way' || !el.geometry?.length) continue;
      try {
        const tags = el.tags ?? {};
        const coords = el.geometry.map((g) => [g.lon, g.lat] as [number, number]);
        const maxSpeed = parseMaxSpeed(tags['maxspeed']);

        await this.prisma.roadSegment.upsert({
          where: { osmId: String(el.id) },
          update: {
            name: tags['name'],
            roadType: tags['highway'],
            maxSpeedKmh: maxSpeed,
            geometry: JSON.stringify({ type: 'LineString', coordinates: coords }),
            rawTags: JSON.stringify(tags),
            updatedAt: new Date(),
          },
          create: {
            osmId: String(el.id),
            source: 'OSM',
            name: tags['name'],
            roadType: tags['highway'],
            maxSpeedKmh: maxSpeed,
            geometry: JSON.stringify({ type: 'LineString', coordinates: coords }),
            city: areaKey.replace('_', ' '),
            country: 'SI',
            rawTags: JSON.stringify(tags),
          },
        });
        imported++;
      } catch {
        errors++;
      }
    }

    await this.logFinish('OSM_OVERPASS', errors === 0 ? 'SUCCESS' : 'PARTIAL', imported);
    this.logger.log(`OSM import [${areaKey}]: ${imported} segments, ${errors} errors`);
    return { imported, errors };
  }

  async importAllAreas() {
    const results: Record<string, { imported: number; errors: number }> = {};
    for (const key of Object.keys(DEMO_BBOXES)) {
      results[key] = await this.importArea(key as keyof typeof DEMO_BBOXES);
      await sleep(2000);
    }
    return results;
  }

  private async logStart(provider: string) {
    await this.prisma.apiProviderStatus.upsert({
      where: { provider },
      update: { status: 'RUNNING', updatedAt: new Date() },
      create: { provider, status: 'RUNNING' },
    });
  }

  private async logFinish(
    provider: string,
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL',
    records: number,
    error?: string,
  ) {
    const now = new Date();
    await this.prisma.dataImportLog.create({
      data: {
        provider,
        status,
        finishedAt: now,
        recordsImported: records,
        errorMessage: error,
      },
    });
    await this.prisma.apiProviderStatus.upsert({
      where: { provider },
      update: {
        status: status === 'SUCCESS' || status === 'PARTIAL' ? 'OK' : 'ERROR',
        lastSuccessAt: status !== 'FAILED' ? now : undefined,
        lastFailureAt: status === 'FAILED' ? now : undefined,
        message: error,
        updatedAt: now,
      },
      create: {
        provider,
        status: status !== 'FAILED' ? 'OK' : 'ERROR',
        lastSuccessAt: status !== 'FAILED' ? now : undefined,
        lastFailureAt: status === 'FAILED' ? now : undefined,
        message: error,
      },
    });
  }
}

function parseMaxSpeed(raw?: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!isNaN(n)) return n;
  if (raw === 'walk') return 10;
  if (raw.toLowerCase().includes('mph')) {
    const mph = parseInt(raw, 10);
    return isNaN(mph) ? null : Math.round(mph * 1.609);
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
