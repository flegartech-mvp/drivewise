import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoresController } from './scores.controller';

@Module({
  providers: [ScoringService],
  controllers: [ScoresController],
  exports: [ScoringService],
})
export class ScoringModule {}
