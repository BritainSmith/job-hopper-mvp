import {
  JobQueryDto,
  JobDto,
  JobStatsDto,
  ScrapeJobsDto,
  ScrapeResultDto,
  CreateJobDto,
  DeduplicationOptionsDto,
  DeduplicationResultDto,
  DeduplicationStatsDto,
  DataQualityMetricsDto,
  CleanedJobDataDto,
} from '../jobs/dto/job.dto';

export interface IJobsController {
  getJobs(query: JobQueryDto): Promise<JobDto[]>;
  getJobStats(): Promise<JobStatsDto>;
  scrapeJobs(body: ScrapeJobsDto): Promise<ScrapeResultDto>;
  getJob(id: string): Promise<JobDto | null>;
  createJob(createJobDto: CreateJobDto): Promise<JobDto>;
  checkForDuplicates(
    jobData: CreateJobDto,
    options: DeduplicationOptionsDto,
  ): Promise<DeduplicationResultDto>;
  processJobsWithDeduplication(
    jobs: CreateJobDto[],
    options: DeduplicationOptionsDto,
  ): Promise<DeduplicationStatsDto>;
  getDeduplicationStats(): Promise<any>;
  getDataQualityMetrics(): Promise<DataQualityMetricsDto>;
  exportCleanedData(): Promise<CleanedJobDataDto[]>;
  cleanJobData(id: string): Promise<CleanedJobDataDto>;
}
