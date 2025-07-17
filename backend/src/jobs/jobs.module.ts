import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';
import { JobDeduplicationService } from '../services/job-deduplication.service';
import { DataCleaningService } from '../services/data-cleaning.service';
import { AIService } from '../services/ai.service';
import { AIJobFilterService } from '../services/ai-job-filter.service';
import { JobRepository } from '../repositories/job.repository';
import { LoggingService } from '../common/services/logging.service';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [ScrapersModule],
  controllers: [JobsController],
  providers: [
    JobService,
    JobDeduplicationService,
    DataCleaningService,
    AIService,
    AIJobFilterService,
    JobRepository,
    LoggingService,
  ],
  exports: [
    JobService,
    JobDeduplicationService,
    DataCleaningService,
    AIService,
    AIJobFilterService,
  ],
})
export class JobsModule {}
