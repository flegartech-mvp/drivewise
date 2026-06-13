import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { ScoringModule } from '../scores/scoring.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [ScoringModule, IngestionModule],
  providers: [SimulationService],
  controllers: [SimulationController],
})
export class SimulationModule {}
