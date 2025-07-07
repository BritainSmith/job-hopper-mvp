import {
  CreateJobDto,
  DeduplicationOptionsDto,
  DeduplicationResultDto,
} from '../jobs/dto/job.dto';

export interface IJobDeduplicationService {
  checkForDuplicates(
    jobData: CreateJobDto,
    options?: DeduplicationOptionsDto,
  ): Promise<DeduplicationResultDto>;
  getDeduplicationStats(): Promise<{
    totalJobs: number;
    potentialDuplicates: number;
    duplicateGroups: number;
    averageSimilarityScore: number;
  }>;
  processJobsWithDeduplication(
    jobs: CreateJobDto[],
    options?: DeduplicationOptionsDto,
  ): Promise<any>;
}
