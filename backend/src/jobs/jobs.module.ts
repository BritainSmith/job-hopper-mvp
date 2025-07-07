import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';
import { JobDeduplicationService } from '../services/job-deduplication.service';
import { DataCleaningService } from '../services/data-cleaning.service';
import { JobRepository } from '../repositories/job.repository';
import { LoggingService } from '../common/services/logging.service';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [ScrapersModule],
  controllers: [JobsController],
  providers: [JobService, JobDeduplicationService, DataCleaningService, JobRepository, LoggingService],
  exports: [JobService, JobDeduplicationService, DataCleaningService],
})
export class JobsModule {}
