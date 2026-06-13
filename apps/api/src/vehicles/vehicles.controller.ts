import {
  Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVehicleSchema, UpdateVehicleSchema } from '@drivewise/shared';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly svc: VehiclesService) {}

  @Post()
  create(@Request() req: ReqUser, @Body() body: unknown) {
    return this.svc.create(req.user.userId, CreateVehicleSchema.parse(body));
  }

  @Get()
  findAll(@Request() req: ReqUser) {
    return this.svc.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: ReqUser, @Param('id') id: string) {
    return this.svc.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req: ReqUser, @Param('id') id: string, @Body() body: unknown) {
    return this.svc.update(req.user.userId, id, UpdateVehicleSchema.parse(body));
  }

  @Delete(':id')
  remove(@Request() req: ReqUser, @Param('id') id: string) {
    return this.svc.remove(req.user.userId, id);
  }
}

type ReqUser = { user: { userId: string } };
