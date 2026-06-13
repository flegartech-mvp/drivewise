import {
  Body, Controller, Get, Param, Post, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StartTripSchema, BatchTripPointsSchema, BatchSensorSamplesSchema } from '@drivewise/shared';

type ReqUser = { user: { userId: string } };

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly svc: TripsService) {}

  @Post('start')
  start(@Request() req: ReqUser, @Body() body: unknown) {
    return this.svc.startTrip(req.user.userId, StartTripSchema.parse(body));
  }

  @Post(':id/points/batch')
  addPoints(@Request() req: ReqUser, @Param('id') id: string, @Body() body: unknown) {
    return this.svc.addBatchPoints(req.user.userId, id, BatchTripPointsSchema.parse(body));
  }

  @Post(':id/sensor-samples/batch')
  addSamples(@Request() req: ReqUser, @Param('id') id: string, @Body() body: unknown) {
    return this.svc.addBatchSensorSamples(req.user.userId, id, BatchSensorSamplesSchema.parse(body));
  }

  @Post(':id/finish')
  finish(@Request() req: ReqUser, @Param('id') id: string) {
    return this.svc.finishTrip(req.user.userId, id);
  }

  @Get()
  findAll(@Request() req: ReqUser) {
    return this.svc.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: ReqUser, @Param('id') id: string) {
    return this.svc.findOne(req.user.userId, id);
  }

  @Get(':id/points')
  points(@Param('id') id: string) {
    return this.svc.findPoints(id);
  }

  @Get(':id/events')
  events(@Param('id') id: string) {
    return this.svc.findEvents(id);
  }

  @Get(':id/sensor-samples')
  samples(@Param('id') id: string) {
    return this.svc.findSensorSamples(id);
  }

  @Get(':id/score-breakdown')
  scoreBreakdown(@Request() req: ReqUser, @Param('id') id: string) {
    return this.svc.getScoreBreakdown(req.user.userId, id);
  }
}
