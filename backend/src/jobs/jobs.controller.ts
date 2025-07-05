import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBody 
} from '@nestjs/swagger';
import { JobService } from '../services/job.service';
import { 
  JobDto, 
  CreateJobDto, 
  UpdateJobDto, 
  JobQueryDto, 
  ScrapeJobsDto, 
  JobStatsDto, 
  ScrapeResultDto 
} from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobService: JobService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get jobs', 
    description: 'Retrieve a list of jobs with optional filtering and pagination' 
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by job status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of jobs to return', type: Number })
  @ApiQuery({ name: 'skip', required: false, description: 'Number of jobs to skip', type: Number })
  @ApiQuery({ name: 'search', required: false, description: 'Search in job title, company, or description' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Jobs retrieved successfully', 
    type: [JobDto] 
  })
  async getJobs(@Query() query: JobQueryDto) {
    const { status, limit, skip, search } = query;
    const pagination = { 
      take: limit || 10, 
      skip: skip || 0 
    };
    
    if (status) {
      return this.jobService.getJobsByStatus(status as any, pagination);
    }
    
    return this.jobService.searchJobs({ 
      query: search, 
      pagination 
    });
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get job statistics', 
    description: 'Retrieve statistics about jobs including counts by status, company, and location' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Job statistics retrieved successfully', 
    type: JobStatsDto 
  })
  async getJobStats(): Promise<JobStatsDto> {
    return this.jobService.getJobStats();
  }

  @Post('scrape')
  @ApiOperation({ 
    summary: 'Scrape jobs', 
    description: 'Scrape jobs from specified source and save them to database' 
  })
  @ApiBody({ type: ScrapeJobsDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Jobs scraped and saved successfully', 
    type: ScrapeResultDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid scraping parameters' 
  })
  async scrapeJobs(@Body() body: ScrapeJobsDto): Promise<ScrapeResultDto> {
    const { source = 'remoteok', options } = body;
    return this.jobService.scrapeAndSaveJobs(source, options);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get job by ID', 
    description: 'Retrieve a specific job by its ID' 
  })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Job retrieved successfully', 
    type: JobDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Job not found' 
  })
  async getJob(@Param('id') id: string): Promise<JobDto | null> {
    return this.jobService.getJobById(parseInt(id));
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create job', 
    description: 'Create a new job manually' 
  })
  @ApiBody({ type: CreateJobDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Job created successfully', 
    type: JobDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid job data' 
  })
  async createJob(@Body() createJobDto: CreateJobDto): Promise<JobDto> {
    return this.jobService.createJob(createJobDto);
  }
} 