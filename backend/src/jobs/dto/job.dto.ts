import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class JobDto {
  @ApiProperty({ description: 'Unique job identifier' })
  id: number;

  @ApiProperty({ description: 'Job title' })
  title: string;

  @ApiProperty({ description: 'Company name' })
  company: string;

  @ApiProperty({ description: 'Job location' })
  location: string;

  @ApiProperty({ description: 'Direct link to apply for the job' })
  applyLink: string;

  @ApiPropertyOptional({ description: 'When the job was posted' })
  postedDate?: string | null;

  @ApiPropertyOptional({ description: 'Salary information' })
  salary?: string | null;

  @ApiProperty({ description: 'Whether the user has applied to this job' })
  applied: boolean;

  @ApiPropertyOptional({ description: 'When the user applied to this job' })
  appliedAt?: Date | null;

  @ApiProperty({ description: 'Current status of the job application' })
  status: string;

  @ApiProperty({ description: 'Source where the job was scraped from' })
  source: string;

  @ApiProperty({ description: 'When the job was scraped' })
  dateScraped: Date;

  @ApiProperty({ description: 'When the job was last updated' })
  lastUpdated: Date;

  @ApiPropertyOptional({
    description: 'Job tags/skills as comma-separated string',
  })
  tags?: string | null;

  @ApiPropertyOptional({ description: 'Searchable text for the job' })
  searchText?: string | null;
}

export class CreateJobDto {
  @ApiProperty({ description: 'Job title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company: string;

  @ApiProperty({ description: 'Job location' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Direct link to apply for the job' })
  @IsString()
  applyLink: string;

  @ApiPropertyOptional({ description: 'When the job was posted' })
  @IsOptional()
  @IsString()
  postedDate?: string;

  @ApiPropertyOptional({ description: 'Salary information' })
  @IsOptional()
  @IsString()
  salary?: string;

  @ApiPropertyOptional({ description: 'Job tags/skills' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Source where the job was scraped from' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateJobDto {
  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Job location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Direct link to apply for the job' })
  @IsOptional()
  @IsString()
  applyLink?: string;

  @ApiPropertyOptional({ description: 'When the job was posted' })
  @IsOptional()
  @IsString()
  postedDate?: string;

  @ApiPropertyOptional({ description: 'Salary information' })
  @IsOptional()
  @IsString()
  salary?: string;

  @ApiPropertyOptional({ description: 'Job tags/skills' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Whether the user has applied to this job',
  })
  @IsOptional()
  @IsBoolean()
  applied?: boolean;

  @ApiPropertyOptional({ description: 'Current status of the job application' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class JobQueryDto {
  @ApiPropertyOptional({ description: 'Filter by job status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by company name' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Filter by location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Search in job title, company, or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of jobs to return', default: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of jobs to skip', default: 0 })
  @IsOptional()
  @IsNumber()
  skip?: number;
}

export class ScrapeJobsDto {
  @ApiPropertyOptional({
    description: 'Source to scrape jobs from',
    default: 'remoteok',
    enum: ['remoteok', 'linkedin', 'arbeitnow', 'relocate', 'all'],
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Scraping options' })
  @IsOptional()
  options?: {
    maxPages?: number;
    delay?: number;
    headless?: boolean;
  };
}

export class JobStatsDto {
  @ApiProperty({ description: 'Total number of jobs' })
  total: number;

  @ApiProperty({ description: 'Number of applied jobs' })
  applied: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ description: 'Jobs grouped by status' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'Jobs grouped by company' })
  byCompany: Record<string, number>;

  @ApiProperty({ description: 'Jobs grouped by location' })
  byLocation: Record<string, number>;
}

export class ScrapeResultDto {
  @ApiProperty({ description: 'Number of jobs scraped' })
  scraped: number;

  @ApiProperty({ description: 'Number of jobs saved to database' })
  saved: number;
}

export class DeduplicationOptionsDto {
  @ApiPropertyOptional({
    description: 'Minimum similarity score for duplicates',
    default: 0.8,
  })
  @IsOptional()
  @IsNumber()
  minSimilarityScore?: number;

  @ApiPropertyOptional({ description: 'Enable fuzzy matching', default: true })
  @IsOptional()
  @IsBoolean()
  enableFuzzyMatching?: boolean;

  @ApiPropertyOptional({
    description: 'Check apply link for duplicates',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  checkApplyLink?: boolean;

  @ApiPropertyOptional({
    description: 'Check title and company for duplicates',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  checkTitleCompany?: boolean;

  @ApiPropertyOptional({
    description: 'Check location for duplicates',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  checkLocation?: boolean;

  @ApiPropertyOptional({
    description: 'Check salary for duplicates',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  checkSalary?: boolean;

  @ApiPropertyOptional({
    description: 'Enable AI-ready processing',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableAIReady?: boolean;
}

export class DeduplicationResultDto {
  @ApiProperty({ description: 'Whether the job is a duplicate' })
  isDuplicate: boolean;

  @ApiProperty({ description: 'Confidence score of the duplicate detection' })
  confidence: number;

  @ApiProperty({ description: 'List of similar jobs with scores' })
  similarJobs: Array<{
    jobId: number;
    score: number;
    reason: string;
    matchedFields: string[];
  }>;

  @ApiProperty({
    description: 'Recommended action',
    enum: ['create', 'update', 'skip'],
  })
  recommendedAction: 'create' | 'update' | 'skip';

  @ApiProperty({ description: 'Reason for the recommendation' })
  reason: string;
}

export class DeduplicationStatsDto {
  @ApiProperty({ description: 'Total number of jobs processed' })
  totalJobsProcessed: number;

  @ApiProperty({ description: 'Number of duplicates found' })
  duplicatesFound: number;

  @ApiProperty({ description: 'Number of jobs created' })
  jobsCreated: number;

  @ApiProperty({ description: 'Number of jobs updated' })
  jobsUpdated: number;

  @ApiProperty({ description: 'Number of jobs skipped' })
  jobsSkipped: number;

  @ApiProperty({ description: 'Average similarity score' })
  averageSimilarityScore: number;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTimeMs: number;
}

export class DataQualityMetricsDto {
  @ApiProperty({ description: 'Total number of jobs' })
  totalJobs: number;

  @ApiProperty({ description: 'Number of jobs with complete data' })
  jobsWithCompleteData: number;

  @ApiProperty({ description: 'Number of jobs with salary information' })
  jobsWithSalary: number;

  @ApiProperty({ description: 'Number of jobs with skills/tags' })
  jobsWithSkills: number;

  @ApiProperty({ description: 'Average quality score' })
  averageQualityScore: number;

  @ApiProperty({ description: 'Common data quality issues' })
  commonIssues: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
}

export class CleanedJobDataDto {
  @ApiProperty({ description: 'Job ID' })
  id: number;

  @ApiProperty({ description: 'Original job title' })
  title: string;

  @ApiProperty({ description: 'Normalized job title for AI processing' })
  normalizedTitle: string;

  @ApiProperty({ description: 'Original company name' })
  company: string;

  @ApiProperty({ description: 'Normalized company name' })
  normalizedCompany: string;

  @ApiProperty({ description: 'Original location' })
  location: string;

  @ApiProperty({ description: 'Normalized location' })
  normalizedLocation: string;

  @ApiProperty({ description: 'Extracted skills from job' })
  extractedSkills: string[];

  @ApiProperty({ description: 'Parsed salary range' })
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  } | null;

  @ApiProperty({ description: 'Extracted experience level' })
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';

  @ApiProperty({ description: 'Extracted job type' })
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';

  @ApiProperty({ description: 'Extracted remote type' })
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';

  @ApiProperty({ description: 'Quality score (0-100)' })
  qualityScore: number;
}
