import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from './common/zod-validation.pipe';
import { ZodExceptionFilter } from './common/zod-exception.filter';

async function bootstrap() {
  // Fail fast in production on a missing/placeholder JWT secret.
  const jwtSecret = process.env.JWT_SECRET ?? '';
  if (
    process.env.NODE_ENV === 'production' &&
    (jwtSecret.length < 32 || jwtSecret.includes('change_me'))
  ) {
    console.error('JWT_SECRET must be a strong (>=32 char) non-default value in production.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // CORS: restrict to an explicit allowlist via CORS_ORIGIN (comma-separated)
  // in production. Falls back to "*" with a warning if unset.
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
  if (corsOrigin === '*' && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  CORS_ORIGIN is unset in production — allowing all origins. Set it to lock down the API.');
  }
  app.enableCors({ origin: corsOrigin });

  // Lightweight liveness probe for Docker/compose and platform health checks.
  app
    .getHttpAdapter()
    .getInstance()
    .get('/health', (_req: unknown, res: { json: (b: unknown) => void }) =>
      res.json({ status: 'ok', uptime: process.uptime() }),
    );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ZodValidationPipe());
  // Map uncaught ZodErrors from controller-level `Schema.parse(body)` calls to
  // 400 Bad Request instead of 500.
  app.useGlobalFilters(new ZodExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('DriveWise API')
    .setDescription('Driving telematics MVP API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚗 DriveWise API running on http://localhost:${port}/api`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
