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
import { AIService } from '../services/ai.service';
import {
  AIJobFilterService,
  AIFilterResult,
  JobRecommendationResult,
} from '../services/ai-job-filter.service';
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
import {
  AIAnalysisRequestDto,
  AIAnalysisResponseDto,
  AIStatusDto,
  BatchAIAnalysisRequestDto,
  BatchAIAnalysisResponseDto,
  AIJobFilterRequestDto,
  AIJobFilterResponseDto,
  AIJobRecommendationRequestDto,
  AIJobRecommendationResponseDto,
} from './dto/ai.dto';
import { IJobsController } from '../interfaces/jobs.controller.interface';
import { JobStatus } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController implements IJobsController {
  constructor(
    private jobService: JobService,
    private jobDeduplicationService: JobDeduplicationService,
    private dataCleaningService: DataCleaningService,
    private aiService: AIService,
    private aiJobFilterService: AIJobFilterService,
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

  // AI Analysis Endpoints

  @Get('ai/status')
  @ApiOperation({
    summary: 'Get AI service status',
    description: 'Check if AI service is available and configured',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI service status retrieved successfully',
    type: AIStatusDto,
  })
  getAIStatus(): AIStatusDto {
    return this.aiService.getStatus();
  }

  @Post('ai/analyze')
  @ApiOperation({
    summary: 'Analyze job with AI',
    description:
      'Analyze a job posting using AI for classification and insights',
  })
  @ApiBody({ type: AIAnalysisRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job analyzed successfully',
    type: AIAnalysisResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'AI service not available',
  })
  async analyzeJob(
    @Body() request: AIAnalysisRequestDto,
  ): Promise<AIAnalysisResponseDto> {
    return this.aiService.analyzeJob(request);
  }

  @Post('ai/analyze/batch')
  @ApiOperation({
    summary: 'Analyze multiple jobs with AI',
    description: 'Analyze multiple job postings using AI with optional caching',
  })
  @ApiBody({ type: BatchAIAnalysisRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs analyzed successfully',
    type: BatchAIAnalysisResponseDto,
  })
  async analyzeJobsBatch(
    @Body() request: BatchAIAnalysisRequestDto,
  ): Promise<BatchAIAnalysisResponseDto> {
    const startTime = Date.now();
    const results: AIAnalysisResponseDto[] = [];
    let totalCost = 0;
    const jobsCached = 0;

    for (const job of request.jobs) {
      try {
        const result = await this.aiService.analyzeJob(job);
        results.push(result);
        totalCost += result.costEstimate;
      } catch (error) {
        // Add error result
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({
          classification: {
            seniorityLevel: 'unknown',
            requiredSkills: [],
            remoteType: 'unknown',
            jobType: 'unknown',
            confidence: 0,
            reasoning: `Analysis failed: ${errorMessage}`,
          },
          processingTime: 0,
          costEstimate: 0,
        });
      }
    }

    return {
      results,
      totalProcessingTime: Date.now() - startTime,
      totalCostEstimate: totalCost,
      jobsProcessed: results.length,
      jobsCached,
    };
  }

  @Get(':id/ai-analysis')
  @ApiOperation({
    summary: 'Analyze existing job with AI',
    description: 'Analyze an existing job from the database using AI',
  })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job analyzed successfully',
    type: AIAnalysisResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found',
  })
  async analyzeExistingJob(
    @Param('id') id: string,
  ): Promise<AIAnalysisResponseDto> {
    const job = await this.jobService.getJobById(parseInt(id));
    if (!job) {
      throw new Error('Job not found');
    }

    return this.aiService.analyzeJob({
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || undefined,
      tags: job.tags || undefined,
    });
  }

  // AI-Powered Job Filtering Endpoints

  @Post('ai/filter')

  // @ts-expect-error Throttle decorator type mismatch in v6.4.0
  @Throttle(3, 60)
  @ApiOperation({
    summary: 'Filter jobs using AI analysis',
    description:
      'Filter jobs based on AI insights like seniority level, skills, remote type, etc.',
  })
  @ApiBody({
    type: AIJobFilterRequestDto,
    examples: {
      basic: {
        summary: 'Basic AI filter',
        value: {
          aiFilters: {
            seniorityLevel: 'mid',
            requiredSkills: ['TypeScript', 'React'],
            remoteType: 'remote',
            jobType: 'full-time',
            companySize: 'medium',
            minConfidence: 0.7,
          },
          traditionalFilters: {
            status: 'active',
            company: 'Tech Corp',
            location: 'Remote',
            search: 'frontend',
          },
          pagination: {
            limit: 10,
            skip: 0,
          },
        },
      },
      minimal: {
        summary: 'Minimal AI filter',
        value: {
          aiFilters: {
            requiredSkills: ['Node.js'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs filtered successfully',
    type: AIJobFilterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid filter parameters or validation errors',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'AI service not available',
  })
  async filterJobsWithAI(
    @Body() request: AIJobFilterRequestDto,
  ): Promise<AIFilterResult> {
    return this.aiJobFilterService.filterJobsWithAI(request);
  }

  @Post('ai/recommendations')

  // @ts-expect-error Throttle decorator type mismatch in v6.4.0
  @Throttle(3, 60)
  @ApiOperation({
    summary: 'Get personalized job recommendations',
    description:
      'Get job recommendations based on user profile and AI analysis',
  })
  @ApiBody({
    type: AIJobRecommendationRequestDto,
    examples: {
      basic: {
        summary: 'Basic recommendation',
        value: {
          userProfile: {
            preferredSeniorityLevel: 'senior',
            preferredSkills: ['JavaScript', 'React'],
            preferredRemoteType: 'remote',
            preferredJobType: 'full-time',
            preferredCompanySize: 'medium',
            location: 'Remote',
            experienceYears: 5,
          },
          limit: 5,
          minMatchScore: 0.6,
        },
      },
      minimal: {
        summary: 'Minimal recommendation',
        value: {
          userProfile: {},
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job recommendations generated successfully',
    type: AIJobRecommendationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user profile or validation errors',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'AI service not available',
  })
  async getJobRecommendations(
    @Body() request: AIJobRecommendationRequestDto,
  ): Promise<JobRecommendationResult> {
    // Debug log for troubleshooting
    console.log(
      'DEBUG: getJobRecommendations request body:',
      JSON.stringify(request),
    );
    return this.aiJobFilterService.getJobRecommendations(request);
  }
}
