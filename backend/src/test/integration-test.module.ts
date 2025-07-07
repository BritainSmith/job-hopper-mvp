import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { databaseConfig, appConfig } from '../config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      ignoreEnvFile: true,
    }),
    PrismaModule,
    JobsModule,
    ScrapersModule,
  ],
})
export class IntegrationTestModule {}
