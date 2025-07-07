import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JobService } from '../services/job.service';
import { JobDeduplicationService } from '../services/job-deduplication.service';
import { DataCleaningService } from '../services/data-cleaning.service';
import {
  JobDto,
  CreateJobDto,
  JobQueryDto,
  ScrapeJobsDto,
  JobStatsDto,
  ScrapeResultDto,
  DeduplicationOptionsDto,
  DeduplicationResultDto,
  DeduplicationStatsDto,
  DataQualityMetricsDto,
  CleanedJobDataDto,
} from './dto/job.dto';
import { IJobsController } from '../interfaces/jobs.controller.interface';
import { JobStatus } from '@prisma/client';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController implements IJobsController {
  constructor(
    private jobService: JobService,
    private jobDeduplicationService: JobDeduplicationService,
    private dataCleaningService: DataCleaningService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get jobs',
    description:
      'Retrieve a list of jobs with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by job status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of jobs to return',
    type: Number,
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of jobs to skip',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in job title, company, or description',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs retrieved successfully',
    type: [JobDto],
  })
  async getJobs(@Query() query: JobQueryDto) {
    const { status, limit, skip, search } = query;
    const pagination = {
      take: limit || 10,
      skip: skip || 0,
    };

    if (status) {
      return this.jobService.getJobsByStatus(status as JobStatus, pagination);
    }

    return this.jobService.searchJobs({
      query: search,
      pagination,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get job statistics',
    description:
      'Retrieve statistics about jobs including counts by status, company, and location',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job statistics retrieved successfully',
    type: JobStatsDto,
  })
  async getJobStats(): Promise<JobStatsDto> {
    return this.jobService.getJobStats();
  }

  @Post('scrape')
  @ApiOperation({
    summary: 'Scrape jobs',
    description: 'Scrape jobs from specified source and save them to database',
  })
  @ApiBody({ type: ScrapeJobsDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Jobs scraped and saved successfully',
    type: ScrapeResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid scraping parameters',
  })
  async scrapeJobs(@Body() body: ScrapeJobsDto): Promise<ScrapeResultDto> {
    const { source = 'remoteok', options } = body;
    return this.jobService.scrapeAndSaveJobs(source, options);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get job by ID',
    description: 'Retrieve a specific job by its ID',
  })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job retrieved successfully',
    type: JobDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found',
  })
  async getJob(@Param('id') id: string): Promise<JobDto | null> {
    return this.jobService.getJobById(parseInt(id));
  }

  @Post()
  @ApiOperation({
    summary: 'Create job',
    description: 'Create a new job manually',
  })
  @ApiBody({ type: CreateJobDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Job created successfully',
    type: JobDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid job data',
  })
  async createJob(@Body() createJobDto: CreateJobDto): Promise<JobDto> {
    return this.jobService.createJob(createJobDto);
  }

  @Post('deduplicate/check')
  @ApiOperation({
    summary: 'Check for duplicates',
    description: 'Check if a job is a duplicate of existing jobs',
  })
  @ApiBody({ type: CreateJobDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Duplicate check completed successfully',
    type: DeduplicationResultDto,
  })
  async checkForDuplicates(
    @Body() jobData: CreateJobDto,
    @Query() options: DeduplicationOptionsDto,
  ): Promise<DeduplicationResultDto> {
    return this.jobDeduplicationService.checkForDuplicates(jobData, options);
  }

  @Post('deduplicate/process')
  @ApiOperation({
    summary: 'Process jobs with deduplication',
    description:
      'Process multiple jobs with deduplication and return statistics',
  })
  @ApiBody({ type: [CreateJobDto] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs processed with deduplication successfully',
    type: DeduplicationStatsDto,
  })
  async processJobsWithDeduplication(
    @Body() jobs: CreateJobDto[],
    @Query() options: DeduplicationOptionsDto,
  ): Promise<DeduplicationStatsDto> {
    return this.jobDeduplicationService.processJobsWithDeduplication(
      jobs,
      options,
    );
  }

  @Get('deduplicate/stats')
  @ApiOperation({
    summary: 'Get deduplication statistics',
    description: 'Get overall deduplication statistics for the database',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deduplication statistics retrieved successfully',
  })
  async getDeduplicationStats() {
    return this.jobDeduplicationService.getDeduplicationStats();
  }

  @Get('data-quality/metrics')
  @ApiOperation({
    summary: 'Get data quality metrics',
    description: 'Get comprehensive data quality metrics for all jobs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data quality metrics retrieved successfully',
    type: DataQualityMetricsDto,
  })
  async getDataQualityMetrics(): Promise<DataQualityMetricsDto> {
    const jobs = await this.jobService.getAllJobs();
    return this.dataCleaningService.getDataQualityMetrics(jobs);
  }

  @Get('data-quality/export')
  @ApiOperation({
    summary: 'Export cleaned data for AI processing',
    description:
      'Export all jobs with cleaned and normalized data for AI processing',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cleaned data exported successfully',
    type: [CleanedJobDataDto],
  })
  async exportCleanedData(): Promise<CleanedJobDataDto[]> {
    const jobs = await this.jobService.getAllJobs();
    return this.dataCleaningService.exportCleanedData(jobs);
  }

  @Get('data-quality/clean/:id')
  @ApiOperation({
    summary: 'Clean specific job data',
    description: 'Clean and normalize data for a specific job',
  })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job data cleaned successfully',
    type: CleanedJobDataDto,
  })
  async cleanJobData(@Param('id') id: string): Promise<CleanedJobDataDto> {
    const job = await this.jobService.getJobById(parseInt(id));
    if (!job) {
      throw new Error('Job not found');
    }
    return this.dataCleaningService.cleanJobData(job);
  }
}
