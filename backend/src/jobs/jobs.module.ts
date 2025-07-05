import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';
import { JobRepository } from '../repositories/job.repository';
import { LoggingService } from '../common/services/logging.service';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [ScrapersModule],
  controllers: [JobsController],
  providers: [JobService, JobRepository, LoggingService],
  exports: [JobService],
})
export class JobsModule {} 