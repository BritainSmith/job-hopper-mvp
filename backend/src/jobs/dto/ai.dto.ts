import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { JobDto } from './job.dto';
import { Type } from 'class-transformer';

export class AIAnalysisRequestDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer',
  })
  @IsString({ message: 'Job title must be a string' })
  @IsNotEmpty({ message: 'Job title is required' })
  @MinLength(2, { message: 'Job title must be at least 2 characters long' })
  @MaxLength(200, { message: 'Job title cannot exceed 200 characters' })
  jobTitle: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Corp',
  })
  @IsString({ message: 'Company name must be a string' })
  @IsNotEmpty({ message: 'Company name is required' })
  @MinLength(1, { message: 'Company name must be at least 1 character long' })
  @MaxLength(100, { message: 'Company name cannot exceed 100 characters' })
  company: string;

  @ApiProperty({
    description: 'Job location',
    example: 'San Francisco, CA',
  })
  @IsString({ message: 'Job location must be a string' })
  @IsNotEmpty({ message: 'Job location is required' })
  @MinLength(2, { message: 'Job location must be at least 2 characters long' })
  @MaxLength(100, { message: 'Job location cannot exceed 100 characters' })
  location: string;

  @ApiPropertyOptional({
    description: 'Job description',
    example: 'We are looking for a senior engineer...',
  })
  @IsOptional()
  @IsString({ message: 'Job description must be a string' })
  @MaxLength(10000, {
    message: 'Job description cannot exceed 10,000 characters',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Salary information',
    example: '$120,000 - $150,000',
  })
  @IsOptional()
  @IsString({ message: 'Salary information must be a string' })
  @MaxLength(200, {
    message: 'Salary information cannot exceed 200 characters',
  })
  salary?: string;

  @ApiPropertyOptional({
    description: 'Job tags',
    example: 'React, TypeScript, Node.js',
  })
  @IsOptional()
  @IsString({ message: 'Job tags must be a string' })
  @MaxLength(500, { message: 'Job tags cannot exceed 500 characters' })
  tags?: string;
}

export class JobClassificationDto {
  @ApiProperty({
    description: 'Seniority level',
    enum: ['entry', 'mid', 'senior', 'lead', 'unknown'],
    example: 'senior',
  })
  @IsEnum(['entry', 'mid', 'senior', 'lead', 'unknown'], {
    message:
      'Seniority level must be one of: entry, mid, senior, lead, unknown',
  })
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';

  @ApiProperty({
    description: 'Required skills',
    type: [String],
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @IsArray({ message: 'Required skills must be an array' })
  @IsString({ each: true, message: 'Each skill must be a string' })
  @ArrayMinSize(1, { message: 'At least one skill is required' })
  @ArrayMaxSize(50, { message: 'Cannot have more than 50 skills' })
  @MaxLength(50, {
    each: true,
    message: 'Each skill cannot exceed 50 characters',
  })
  requiredSkills: string[];

  @ApiProperty({
    description: 'Remote work type',
    enum: ['remote', 'hybrid', 'onsite', 'unknown'],
    example: 'remote',
  })
  @IsEnum(['remote', 'hybrid', 'onsite', 'unknown'], {
    message: 'Remote work type must be one of: remote, hybrid, onsite, unknown',
  })
  remoteType: 'remote' | 'hybrid' | 'onsite' | 'unknown';

  @ApiProperty({
    description: 'Job type',
    enum: ['full-time', 'part-time', 'contract', 'internship', 'unknown'],
    example: 'full-time',
  })
  @IsEnum(['full-time', 'part-time', 'contract', 'internship', 'unknown'], {
    message:
      'Job type must be one of: full-time, part-time, contract, internship, unknown',
  })
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';

  @ApiPropertyOptional({
    description: 'Company size',
    enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'],
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'], {
    message:
      'Company size must be one of: startup, small, medium, large, enterprise, unknown',
  })
  companySize?:
    | 'startup'
    | 'small'
    | 'medium'
    | 'large'
    | 'enterprise'
    | 'unknown';

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber({}, { message: 'Confidence must be a number' })
  @Min(0, { message: 'Confidence must be at least 0' })
  @Max(1, { message: 'Confidence cannot exceed 1' })
  confidence: number;

  @ApiProperty({
    description: 'Reasoning for classification',
    example:
      'This job requires 5+ years of experience and leadership responsibilities',
  })
  @IsString({ message: 'Reasoning must be a string' })
  @IsNotEmpty({ message: 'Reasoning is required' })
  @MaxLength(1000, { message: 'Reasoning cannot exceed 1,000 characters' })
  reasoning: string;
}

export class MarketInsightsDto {
  @ApiPropertyOptional({ description: 'Salary range' })
  @IsOptional()
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };

  @ApiPropertyOptional({
    description: 'Market position',
    enum: ['below', 'average', 'above'],
  })
  @IsOptional()
  @IsEnum(['below', 'average', 'above'])
  marketPosition?: 'below' | 'average' | 'above';

  @ApiPropertyOptional({
    description: 'Demand level',
    enum: ['low', 'medium', 'high'],
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  demandLevel?: 'low' | 'medium' | 'high';
}

export class AIAnalysisResponseDto {
  @ApiProperty({
    description: 'Job classification',
    type: JobClassificationDto,
  })
  classification: JobClassificationDto;

  @ApiPropertyOptional({
    description: 'Market insights',
    type: MarketInsightsDto,
  })
  marketInsights?: MarketInsightsDto;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  @IsNumber()
  processingTime: number;

  @ApiProperty({ description: 'Estimated cost in USD' })
  @IsNumber()
  costEstimate: number;
}

export class AIStatusDto {
  @ApiProperty({ description: 'Whether AI service is available' })
  available: boolean;

  @ApiProperty({ description: 'AI model being used' })
  model: string;

  @ApiProperty({ description: 'Whether AI is properly configured' })
  configured: boolean;
}

export class BatchAIAnalysisRequestDto {
  @ApiProperty({ description: 'Jobs to analyze', type: [AIAnalysisRequestDto] })
  @IsArray()
  jobs: AIAnalysisRequestDto[];

  @ApiPropertyOptional({
    description: 'Enable caching for similar jobs',
    default: true,
  })
  @IsOptional()
  enableCaching?: boolean;
}

export class BatchAIAnalysisResponseDto {
  @ApiProperty({
    description: 'Analysis results for each job',
    type: [AIAnalysisResponseDto],
  })
  results: AIAnalysisResponseDto[];

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  totalProcessingTime: number;

  @ApiProperty({ description: 'Total cost estimate' })
  totalCostEstimate: number;

  @ApiProperty({ description: 'Number of jobs processed' })
  jobsProcessed: number;

  @ApiProperty({ description: 'Number of jobs served from cache' })
  jobsCached: number;
}

// AI-Powered Job Filtering DTOs

export class AIJobFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by seniority level',
    enum: ['entry', 'mid', 'senior', 'lead', 'unknown'],
    example: 'senior',
  })
  @IsOptional()
  @IsEnum(['entry', 'mid', 'senior', 'lead', 'unknown'], {
    message:
      'Seniority level must be one of: entry, mid, senior, lead, unknown',
  })
  seniorityLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';

  @ApiPropertyOptional({
    description:
      'Filter by required skills (jobs must have ALL specified skills)',
    type: [String],
    example: ['JavaScript', 'React'],
  })
  @IsOptional()
  @IsArray({ message: 'Required skills must be an array' })
  @IsString({ each: true, message: 'Each skill must be a string' })
  @ArrayMaxSize(20, { message: 'Cannot filter by more than 20 skills' })
  @MaxLength(50, {
    each: true,
    message: 'Each skill cannot exceed 50 characters',
  })
  requiredSkills?: string[];

  @ApiPropertyOptional({
    description: 'Filter by remote work type',
    enum: ['remote', 'hybrid', 'onsite', 'unknown'],
    example: 'remote',
  })
  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite', 'unknown'], {
    message: 'Remote work type must be one of: remote, hybrid, onsite, unknown',
  })
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';

  @ApiPropertyOptional({
    description: 'Filter by job type',
    enum: ['full-time', 'part-time', 'contract', 'internship', 'unknown'],
    example: 'full-time',
  })
  @IsOptional()
  @IsEnum(['full-time', 'part-time', 'contract', 'internship', 'unknown'], {
    message:
      'Job type must be one of: full-time, part-time, contract, internship, unknown',
  })
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';

  @ApiPropertyOptional({
    description: 'Filter by company size',
    enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'],
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'], {
    message:
      'Company size must be one of: startup, small, medium, large, enterprise, unknown',
  })
  companySize?:
    | 'startup'
    | 'small'
    | 'medium'
    | 'large'
    | 'enterprise'
    | 'unknown';

  @ApiPropertyOptional({
    description: 'Minimum confidence score for AI analysis (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.7,
    example: 0.7,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum confidence must be a number' })
  @Min(0, { message: 'Minimum confidence must be at least 0' })
  @Max(1, { message: 'Minimum confidence cannot exceed 1' })
  minConfidence?: number;

  @ApiPropertyOptional({
    description: "Whether to analyze jobs that haven't been analyzed yet",
    default: true,
    example: true,
  })
  @IsOptional()
  analyzeUnanalyzed?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of jobs to analyze (for performance)',
    default: 50,
    example: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maximum jobs to analyze must be a number' })
  @Min(1, { message: 'Maximum jobs to analyze must be at least 1' })
  @Max(200, { message: 'Maximum jobs to analyze cannot exceed 200' })
  maxJobsToAnalyze?: number;
}

export class AIJobFilterRequestDto {
  @ApiPropertyOptional({ description: 'AI-based filtering criteria' })
  @IsOptional()
  aiFilters?: AIJobFilterDto;

  @ApiPropertyOptional({ description: 'Traditional filtering criteria' })
  @IsOptional()
  traditionalFilters?: {
    status?: string;
    company?: string;
    location?: string;
    search?: string;
  };

  @ApiPropertyOptional({ description: 'Pagination options' })
  @IsOptional()
  pagination?: {
    limit?: number;
    skip?: number;
  };
}

export class AIJobFilterResponseDto {
  @ApiProperty({
    description: 'Filtered jobs with AI analysis',
    type: [JobDto],
  })
  jobs: JobDto[];

  @ApiProperty({ description: 'Total number of jobs matching filters' })
  totalJobs: number;

  @ApiProperty({ description: 'Number of jobs analyzed during this request' })
  jobsAnalyzed: number;

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  processingTime: number;

  @ApiProperty({ description: 'Total AI analysis cost' })
  totalCost: number;

  @ApiProperty({ description: 'Filter summary' })
  filterSummary: {
    appliedFilters: string[];
    confidenceDistribution: Record<string, number>;
    seniorityDistribution: Record<string, number>;
    remoteTypeDistribution: Record<string, number>;
  };
}

export class UserProfileDto {
  @ApiPropertyOptional({
    description: 'Preferred seniority level',
    enum: ['entry', 'mid', 'senior', 'lead'],
    example: 'senior',
  })
  @IsOptional()
  @IsEnum(['entry', 'mid', 'senior', 'lead'], {
    message:
      'Preferred seniority level must be one of: entry, mid, senior, lead',
  })
  preferredSeniorityLevel?: 'entry' | 'mid' | 'senior' | 'lead';

  @ApiPropertyOptional({
    description: 'Preferred skills',
    type: [String],
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @IsOptional()
  @IsArray({ message: 'Preferred skills must be an array' })
  @IsString({ each: true, message: 'Each preferred skill must be a string' })
  @ArrayMaxSize(20, { message: 'Cannot have more than 20 preferred skills' })
  @MaxLength(50, {
    each: true,
    message: 'Each preferred skill cannot exceed 50 characters',
  })
  preferredSkills?: string[];

  @ApiPropertyOptional({
    description: 'Preferred remote work type',
    enum: ['remote', 'hybrid', 'onsite'],
    example: 'remote',
  })
  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite'], {
    message:
      'Preferred remote work type must be one of: remote, hybrid, onsite',
  })
  preferredRemoteType?: 'remote' | 'hybrid' | 'onsite';

  @ApiPropertyOptional({
    description: 'Preferred job type',
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    example: 'full-time',
  })
  @IsOptional()
  @IsEnum(['full-time', 'part-time', 'contract', 'internship'], {
    message:
      'Preferred job type must be one of: full-time, part-time, contract, internship',
  })
  preferredJobType?: 'full-time' | 'part-time' | 'contract' | 'internship';

  @ApiPropertyOptional({
    description: 'Preferred company size',
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise'], {
    message:
      'Preferred company size must be one of: startup, small, medium, large, enterprise',
  })
  preferredCompanySize?:
    | 'startup'
    | 'small'
    | 'medium'
    | 'large'
    | 'enterprise';

  @ApiPropertyOptional({
    description: 'Preferred location',
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString({ message: 'Preferred location must be a string' })
  @MaxLength(100, {
    message: 'Preferred location cannot exceed 100 characters',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Years of experience',
    minimum: 0,
    maximum: 50,
    example: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Years of experience must be a number' })
  @Min(0, { message: 'Years of experience must be at least 0' })
  @Max(50, { message: 'Years of experience cannot exceed 50' })
  experienceYears?: number;
}

export class AIJobRecommendationRequestDto {
  @ApiProperty({
    description: 'User profile for job recommendations',
    type: UserProfileDto,
    example: {
      preferredSeniorityLevel: 'senior',
      preferredSkills: ['JavaScript', 'React'],
      preferredRemoteType: 'remote',
    },
  })
  @ValidateNested({ message: 'User profile must be a valid object' })
  @Type(() => UserProfileDto)
  userProfile: UserProfileDto;

  @ApiPropertyOptional({
    description: 'Number of recommendations to return',
    default: 10,
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Minimum match score (0-1)',
    default: 0.6,
    example: 0.6,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum match score must be a number' })
  @Min(0, { message: 'Minimum match score must be at least 0' })
  @Max(1, { message: 'Minimum match score cannot exceed 1' })
  minMatchScore?: number;
}

export class AIJobRecommendationResponseDto {
  @ApiProperty({
    description: 'Recommended jobs with match scores',
    type: [JobDto],
  })
  recommendations: Array<
    JobDto & {
      matchScore: number;
      matchReasons: string[];
      aiAnalysis?: AIAnalysisResponseDto;
    }
  >;

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  processingTime: number;

  @ApiProperty({ description: 'Total AI analysis cost' })
  totalCost: number;

  @ApiProperty({ description: 'Recommendation summary' })
  summary: {
    totalJobsAnalyzed: number;
    averageMatchScore: number;
    topMatchReasons: string[];
  };
}
