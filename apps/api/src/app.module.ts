import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TripsModule } from './trips/trips.module';
import { ScoringModule } from './scores/scoring.module';
import { RewardsModule } from './rewards/rewards.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SimulationModule } from './simulation/simulation.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    VehiclesModule,
    TripsModule,
    ScoringModule,
    RewardsModule,
    IngestionModule,
    SimulationModule,
    AdminModule,
  ],
})
export class AppModule {}
