import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SpeedLimitService } from './speed-limit.service';
import { RoadMatchingService } from './road-matching.service';
import { OsmImportService } from './osm-import.service';
import { TrafficImportService } from './traffic-import.service';
import { WeatherService } from './weather.service';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    SpeedLimitService,
    RoadMatchingService,
    OsmImportService,
    TrafficImportService,
    WeatherService,
  ],
  controllers: [IngestionController],
  exports: [SpeedLimitService, WeatherService, OsmImportService, TrafficImportService],
})
export class IngestionModule {}
