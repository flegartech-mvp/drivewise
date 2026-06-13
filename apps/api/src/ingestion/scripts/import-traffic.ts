import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TrafficImportService } from '../traffic-import.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const svc = app.get(TrafficImportService);
  const result = await svc.importTrafficEvents();
  console.log('Traffic Import result:', JSON.stringify(result, null, 2));
  await app.close();
}

run().catch(console.error);
