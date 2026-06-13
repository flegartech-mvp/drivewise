import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from '@drivewise/shared';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: { userId, ...dto } });
  }

  findAll(userId: string) {
    return this.prisma.vehicle.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(userId: string, id: string) {
    const v = await this.prisma.vehicle.findFirst({ where: { id, userId } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async update(userId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(userId, id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
