import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Job Hopper API')
    .setDescription('A comprehensive API for job scraping, management, and application tracking')
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

  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Job Hopper API is running on: http://localhost:3000');
  console.log('📚 API Documentation available at: http://localhost:3000/api');
}
bootstrap();
