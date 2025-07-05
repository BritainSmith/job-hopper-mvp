import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';
import { JobRepository } from '../repositories/job.repository';
import { RemoteOKService } from '../scrapers/remoteok.service';
import { LoggingService } from '../common/services/logging.service';

@Module({
  controllers: [JobsController],
  providers: [JobService, JobRepository, RemoteOKService, LoggingService],
  exports: [JobService],
})
export class JobsModule {} 