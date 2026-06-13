import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OsmImportService } from './osm-import.service';
import { TrafficImportService } from './traffic-import.service';
import { WeatherService } from './weather.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ingestion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class IngestionController {
  constructor(
    private readonly osm: OsmImportService,
    private readonly traffic: TrafficImportService,
    private readonly weather: WeatherService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('ingestion/osm/import')
  importOsm() {
    return this.osm.importAllAreas();
  }

  @Post('ingestion/traffic/import')
  importTraffic() {
    return this.traffic.importTrafficEvents();
  }

  @Get('ingestion/logs')
  getLogs() {
    return this.prisma.dataImportLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  @Get('ingestion/provider-status')
  getProviderStatus() {
    return this.prisma.apiProviderStatus.findMany();
  }

  @Get('road-segments')
  getRoadSegments(@Query('limit') limit = '100') {
    return this.prisma.roadSegment.findMany({
      take: Math.min(parseInt(limit, 10), 500),
      orderBy: { importedAt: 'desc' },
    });
  }

  @Get('road-segments/nearby')
  getNearby(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.prisma.roadSegment.findMany({ take: 20 });
  }

  @Get('traffic-events')
  getTrafficEvents() {
    return this.traffic.getRecentEvents();
  }

  @Get('weather/current')
  getWeather(@Query('lat') lat = '46.66', @Query('lng') lng = '16.17') {
    return this.weather.getCurrentWeather(parseFloat(lat), parseFloat(lng));
  }
}
