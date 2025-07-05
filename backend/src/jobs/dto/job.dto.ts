import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsNumber,
  IsArray,
} from 'class-validator';

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
