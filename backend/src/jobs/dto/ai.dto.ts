import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';

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
    description: 'Analysis results',
    type: [AIAnalysisResponseDto],
  })
  results: AIAnalysisResponseDto[];

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  @IsNumber()
  totalProcessingTime: number;

  @ApiProperty({ description: 'Total estimated cost in USD' })
  @IsNumber()
  totalCostEstimate: number;

  @ApiProperty({ description: 'Number of jobs processed' })
  @IsNumber()
  jobsProcessed: number;

  @ApiProperty({ description: 'Number of jobs cached' })
  @IsNumber()
  jobsCached: number;
}
