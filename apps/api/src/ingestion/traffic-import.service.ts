import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

interface PrometEvent {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  y_wgs?: number;
  x_wgs?: number;
  road?: string;
  validFrom?: string;
  validTo?: string;
}

@Injectable()
export class TrafficImportService {
  private readonly logger = new Logger(TrafficImportService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledImport() {
    const enabled = this.config.get<string>('ENABLE_SCHEDULERS') === 'true';
    if (!enabled) return;
    await this.importTrafficEvents();
  }

  async importTrafficEvents(): Promise<{ imported: number; errors: number }> {
    const provider = this.config.get<string>('TRAFFIC_PROVIDER', 'NONE');
    if (provider === 'NONE') {
      return { imported: 0, errors: 0 };
    }

    await this.updateProviderStatus('PROMET', 'RUNNING');

    try {
      const events = await this.fetchFromPromet();
      let imported = 0;
      let errors = 0;

      for (const ev of events) {
        try {
          await this.prisma.trafficEvent.upsert({
            where: { id: `promet_${ev.id ?? Math.random()}` },
            update: {
              title: ev.title ?? 'Traffic event',
              description: ev.description,
              severity: ev.severity,
              latitude: ev.y_wgs,
              longitude: ev.x_wgs,
              roadName: ev.road,
              validFrom: ev.validFrom ? new Date(ev.validFrom) : undefined,
              validTo: ev.validTo ? new Date(ev.validTo) : undefined,
              rawPayload: JSON.stringify(ev),
              importedAt: new Date(),
            },
            create: {
              id: `promet_${ev.id ?? Math.random()}`,
              source: 'PROMET',
              externalId: ev.id ? String(ev.id) : undefined,
              type: ev.category ?? 'unknown',
              title: ev.title ?? 'Traffic event',
              description: ev.description,
              severity: ev.severity,
              latitude: ev.y_wgs,
              longitude: ev.x_wgs,
              roadName: ev.road,
              validFrom: ev.validFrom ? new Date(ev.validFrom) : undefined,
              validTo: ev.validTo ? new Date(ev.validTo) : undefined,
              rawPayload: JSON.stringify(ev),
            },
          });
          imported++;
        } catch {
          errors++;
        }
      }

      await this.logImport('PROMET', 'SUCCESS', imported);
      return { imported, errors };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Traffic import failed: ${msg}`);
      await this.logImport('PROMET', 'FAILED', 0, msg);
      return { imported: 0, errors: 1 };
    }
  }

  private async fetchFromPromet(): Promise<PrometEvent[]> {
    const url = this.config.get<string>('PROMET_API_URL', 'https://promet.si/api/');
    const res = await axios.get<PrometEvent[]>(`${url}events`, { timeout: 10000 });
    return Array.isArray(res.data) ? res.data : [];
  }

  async getRecentEvents(limit = 100) {
    return this.prisma.trafficEvent.findMany({
      orderBy: { importedAt: 'desc' },
      take: limit,
    });
  }

  private async logImport(
    provider: string,
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL',
    records: number,
    error?: string,
  ) {
    const now = new Date();
    await this.prisma.dataImportLog.create({
      data: { provider, status, finishedAt: now, recordsImported: records, errorMessage: error },
    });
    await this.updateProviderStatus(
      provider,
      status !== 'FAILED' ? 'OK' : 'ERROR',
      now,
      status === 'FAILED' ? now : undefined,
      error,
    );
  }

  private async updateProviderStatus(
    provider: string,
    status: string,
    lastSuccessAt?: Date,
    lastFailureAt?: Date,
    message?: string,
  ) {
    await this.prisma.apiProviderStatus.upsert({
      where: { provider },
      update: { status, lastSuccessAt, lastFailureAt, message, updatedAt: new Date() },
      create: { provider, status, lastSuccessAt, lastFailureAt, message },
    });
  }
}
