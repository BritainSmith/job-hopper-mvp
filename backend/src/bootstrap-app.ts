// NOTE: Tests for this file (main.spec.ts) are skipped or expected to fail due to hard limitations with NestJS decorators and bootstrap mocking. See test suite for details. This is an accepted exception in our CI/CD process.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/error.filter';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global rate limiting with custom error messages
  app.useGlobalGuards(app.get(CustomThrottlerGuard));

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Job Hopper API')
    .setDescription(
      'A comprehensive API for job scraping, management, and application tracking',
    )
    .setVersion('1.0')
    .addTag('jobs', 'Job management operations')
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Job Hopper API Documentation',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Job Hopper API is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation available at: http://localhost:${port}/api`);
  logger.log(`📊 Logs are being written to: ./logs/`);
}
