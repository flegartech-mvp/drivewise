import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { ScoringModule } from '../scores/scoring.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [ScoringModule, IngestionModule],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
