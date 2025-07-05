import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { WinstonConfigModule } from './config/winston.module';
import { HealthModule } from './health/health.module';
import { ScrapersModule } from './scrapers/scrapers.module';
import { 
  databaseConfig, 
  appConfig, 
  scraperConfig, 
  securityConfig, 
  apiKeysConfig, 
  externalServicesConfig, 
  emailConfig 
} from './config/env.config';
import { scrapersConfig } from './config/scrapers.config';

@Module({
  imports: [
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
        scrapersConfig
      ],
    }),
    WinstonConfigModule,
    PrismaModule,
    JobsModule,
    HealthModule,
    ScrapersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
