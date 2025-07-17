import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { JobDto } from './job.dto';
import { Type } from 'class-transformer';

export class AIAnalysisRequestDto {
  @ApiProperty({ description: 'Job title' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company: string;

  @ApiProperty({ description: 'Job location' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Salary information' })
  @IsOptional()
  @IsString()
  salary?: string;

  @ApiPropertyOptional({ description: 'Job tags' })
  @IsOptional()
  @IsString()
  tags?: string;
}

export class JobClassificationDto {
  @ApiProperty({
    description: 'Seniority level',
    enum: ['entry', 'mid', 'senior', 'lead', 'unknown'],
  })
  @IsEnum(['entry', 'mid', 'senior', 'lead', 'unknown'])
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';

  @ApiProperty({ description: 'Required skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  requiredSkills: string[];

  @ApiProperty({
    description: 'Remote work type',
    enum: ['remote', 'hybrid', 'onsite', 'unknown'],
  })
  @IsEnum(['remote', 'hybrid', 'onsite', 'unknown'])
  remoteType: 'remote' | 'hybrid' | 'onsite' | 'unknown';

  @ApiProperty({
    description: 'Job type',
    enum: ['full-time', 'part-time', 'contract', 'internship', 'unknown'],
  })
  @IsEnum(['full-time', 'part-time', 'contract', 'internship', 'unknown'])
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';

  @ApiPropertyOptional({
    description: 'Company size',
    enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'],
  })
  @IsOptional()
  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'])
  companySize?:
    | 'startup'
    | 'small'
    | 'medium'
    | 'large'
    | 'enterprise'
    | 'unknown';

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for classification' })
  @IsString()
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
  })
  @IsOptional()
  @IsEnum(['entry', 'mid', 'senior', 'lead', 'unknown'])
  seniorityLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';

  @ApiPropertyOptional({
    description:
      'Filter by required skills (jobs must have ALL specified skills)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({
    description: 'Filter by remote work type',
    enum: ['remote', 'hybrid', 'onsite', 'unknown'],
  })
  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite', 'unknown'])
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';

  @ApiPropertyOptional({
    description: 'Filter by job type',
    enum: ['full-time', 'part-time', 'contract', 'internship', 'unknown'],
  })
  @IsOptional()
  @IsEnum(['full-time', 'part-time', 'contract', 'internship', 'unknown'])
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';

  @ApiPropertyOptional({
    description: 'Filter by company size',
    enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'],
  })
  @IsOptional()
  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'])
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
  })
  @IsOptional()
  @IsNumber()
  minConfidence?: number;

  @ApiPropertyOptional({
    description: "Whether to analyze jobs that haven't been analyzed yet",
    default: true,
  })
  @IsOptional()
  analyzeUnanalyzed?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of jobs to analyze (for performance)',
    default: 50,
  })
  @IsOptional()
  @IsNumber()
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
  })
  @IsOptional()
  @IsEnum(['entry', 'mid', 'senior', 'lead'])
  preferredSeniorityLevel?: 'entry' | 'mid' | 'senior' | 'lead';

  @ApiPropertyOptional({
    description: 'Preferred skills',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @ApiPropertyOptional({
    description: 'Preferred remote work type',
    enum: ['remote', 'hybrid', 'onsite'],
  })
  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite'])
  preferredRemoteType?: 'remote' | 'hybrid' | 'onsite';

  @ApiPropertyOptional({
    description: 'Preferred job type',
    enum: ['full-time', 'part-time', 'contract', 'internship'],
  })
  @IsOptional()
  @IsEnum(['full-time', 'part-time', 'contract', 'internship'])
  preferredJobType?: 'full-time' | 'part-time' | 'contract' | 'internship';

  @ApiPropertyOptional({
    description: 'Preferred company size',
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
  })
  @IsOptional()
  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise'])
  preferredCompanySize?:
    | 'startup'
    | 'small'
    | 'medium'
    | 'large'
    | 'enterprise';

  @ApiPropertyOptional({ description: 'Preferred location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Years of experience',
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  experienceYears?: number;
}

export class AIJobRecommendationRequestDto {
  @ApiProperty({
    description: 'User profile for job recommendations',
    type: UserProfileDto,
  })
  @ValidateNested()
  @Type(() => UserProfileDto)
  userProfile: UserProfileDto;

  @ApiPropertyOptional({
    description: 'Number of recommendations to return',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Minimum match score (0-1)',
    default: 0.6,
  })
  @IsOptional()
  @IsNumber()
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
