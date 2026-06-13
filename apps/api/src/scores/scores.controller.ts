import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type ReqUser = { user: { userId: string } };

@ApiTags('scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scores')
export class ScoresController {
  constructor(private readonly svc: ScoringService) {}

  @Get('me/monthly')
  monthly(@Request() req: ReqUser) {
    return this.svc.getMonthlySummary(req.user.userId);
  }

  @Get('me/summary')
  summary(@Request() req: ReqUser) {
    return this.svc.getSummary(req.user.userId);
  }

  @Get('me/achievements')
  achievements(@Request() req: ReqUser) {
    return this.svc.getAchievements(req.user.userId);
  }

  @Get('me/weekly-report')
  weeklyReport(@Request() req: ReqUser) {
    return this.svc.getWeeklyReport(req.user.userId);
  }
}
