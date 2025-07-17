import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { WinstonConfigModule } from './config/winston.module';
import { HealthModule } from './health/health.module';
import { ScrapersModule } from './scrapers/scrapers.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import {
  databaseConfig,
  appConfig,
  scraperConfig,
  securityConfig,
  apiKeysConfig,
  externalServicesConfig,
  emailConfig,
} from './config/env.config';
import { scrapersConfig } from './config/scrapers.config';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 10, limit: 2 }, // 2 requests per 10 seconds
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        appConfig,
        scraperConfig,
        securityConfig,
        apiKeysConfig,
        externalServicesConfig,
        emailConfig,
        scrapersConfig,
      ],
    }),
    WinstonConfigModule,
    PrismaModule,
    JobsModule,
    HealthModule,
    ScrapersModule,
  ],
  controllers: [AppController],
  providers: [AppService, CustomThrottlerGuard],
})
export class AppModule {}
