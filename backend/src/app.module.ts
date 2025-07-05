import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobRepository } from './repositories/job.repository';
import { JobService } from './services/job.service';
import { RemoteOKService } from './scrapers/remoteok.service';
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
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JobRepository,
    JobService,
    RemoteOKService,
  ],
})
export class AppModule {}
