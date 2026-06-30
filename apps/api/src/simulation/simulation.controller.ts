import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SimulationService } from './simulation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { ScenarioId } from '@drivewise/simulation';
import { z } from 'zod';

const GenerateTripSchema = z.object({
  scenarioId: z.string(),
});

type ReqUser = { user: { userId: string } };

@ApiTags('simulation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('simulation')
export class SimulationController {
  constructor(private readonly svc: SimulationService) {}

  @Get('scenarios')
  getScenarios() {
    return this.svc.getScenarios();
  }

  @Post('trips/generate')
  generate(@Request() req: ReqUser, @Body() body: unknown) {
    const { scenarioId } = GenerateTripSchema.parse(body);
    return this.svc.generateDemoTrip(req.user.userId, scenarioId as ScenarioId);
  }
}
