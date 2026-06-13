import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SimulationService } from '../../simulation/simulation.service';
import { PrismaClient } from '@prisma/client';
import { SCENARIOS } from '@drivewise/simulation';

async function run() {
  const prismaRaw = new PrismaClient();
  const driver = await prismaRaw.user.findFirst({ where: { role: 'DRIVER' } });
  await prismaRaw.$disconnect();

  if (!driver) {
    console.error('No driver found. Run: npm run db:seed first.');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const svc = app.get(SimulationService);

  const demoScenarios = ['safe_city', 'aggressive_driver', 'harsh_braking', 'speeding', 'full_risk'];
  for (const sid of demoScenarios) {
    console.log(`Generating demo trip: ${sid}…`);
    const result = await svc.generateDemoTrip(driver.id, sid as any);
    console.log(`  → tripId=${result.tripId} score=${result.score.finalScore} events=${result.eventsDetected}`);
  }

  console.log('✅ Demo trips generated.');
  await app.close();
}

run().catch(console.error);
