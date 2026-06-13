import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { OsmImportService } from '../osm-import.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const svc = app.get(OsmImportService);
  const result = await svc.importAllAreas();
  console.log('OSM Import result:', JSON.stringify(result, null, 2));
  await app.close();
}

run().catch(console.error);
