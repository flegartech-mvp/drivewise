import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type ReqUser = { user: { userId: string } };

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly svc: RewardsService) {}

  @Get('me')
  getMyRewards(@Request() req: ReqUser) {
    return this.svc.getMyRewards(req.user.userId);
  }

  @Get('simulator')
  simulate(@Request() req: ReqUser) {
    return this.svc.getSimulation(req.user.userId);
  }
}
