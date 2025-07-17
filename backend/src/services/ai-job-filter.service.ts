import { Injectable, Logger } from '@nestjs/common';
import { JobRepository } from '../repositories/job.repository';
import { AIService } from './ai.service';
import { DataCleaningService } from './data-cleaning.service';
import { Job as PrismaJob } from '@prisma/client';
import {
  AIJobFilterDto,
  AIJobFilterRequestDto,
  AIJobRecommendationRequestDto,
  AIAnalysisResponseDto,
  UserProfileDto,
} from '../jobs/dto/ai.dto';

export interface JobWithAIAnalysis extends PrismaJob {
  aiAnalysis?: AIAnalysisResponseDto;
}

export interface AIFilterResult {
  jobs: JobWithAIAnalysis[];
  totalJobs: number;
  jobsAnalyzed: number;
  processingTime: number;
  totalCost: number;
  filterSummary: {
    appliedFilters: string[];
    confidenceDistribution: Record<string, number>;
    seniorityDistribution: Record<string, number>;
    remoteTypeDistribution: Record<string, number>;
  };
}

export interface JobRecommendationResult {
  recommendations: Array<
    PrismaJob & {
      matchScore: number;
      matchReasons: string[];
      aiAnalysis?: AIAnalysisResponseDto;
    }
  >;
  processingTime: number;
  totalCost: number;
  summary: {
    totalJobsAnalyzed: number;
    averageMatchScore: number;
    topMatchReasons: string[];
  };
}

@Injectable()
export class AIJobFilterService {
  private readonly logger = new Logger(AIJobFilterService.name);

  constructor(
    private jobRepository: JobRepository,
    private aiService: AIService,
    private dataCleaningService: DataCleaningService,
  ) {}

  /**
   * Filter jobs using AI analysis
   */
  async filterJobsWithAI(
    request: AIJobFilterRequestDto,
  ): Promise<AIFilterResult> {
    const startTime = Date.now();
    let totalCost = 0;
    let jobsAnalyzed = 0;

    try {
      this.logger.log('Starting AI-powered job filtering', {
        aiFilters: request.aiFilters,
        traditionalFilters: request.traditionalFilters,
      });

      // Get all jobs (we'll filter them with AI)
      const allJobs = await this.jobRepository.getJobs();
      let filteredJobs: JobWithAIAnalysis[] = [];

      // Apply traditional filters first
      const traditionallyFilteredJobs = this.applyTraditionalFilters(
        allJobs,
        request.traditionalFilters,
      );

      // Apply AI filters
      if (request.aiFilters) {
        const aiFilteredJobs = await this.applyAIFilters(
          traditionallyFilteredJobs,
          request.aiFilters,
        );
        filteredJobs = aiFilteredJobs.jobs;
        totalCost = aiFilteredJobs.totalCost;
        jobsAnalyzed = aiFilteredJobs.jobsAnalyzed;
      } else {
        filteredJobs = traditionallyFilteredJobs.map((job) => ({ ...job }));
      }

      // Apply pagination
      const paginatedJobs = this.applyPagination(
        filteredJobs,
        request.pagination,
      );

      // Generate filter summary
      const filterSummary = this.generateFilterSummary(filteredJobs);

      const processingTime = Date.now() - startTime;

      this.logger.log('AI job filtering completed', {
        totalJobs: allJobs.length,
        filteredJobs: filteredJobs.length,
        jobsAnalyzed,
        processingTime,
        totalCost,
      });

      return {
        jobs: paginatedJobs,
        totalJobs: filteredJobs.length,
        jobsAnalyzed,
        processingTime,
        totalCost,
        filterSummary,
      };
    } catch (error) {
      this.logger.error('Error in AI job filtering:', error);
      throw new Error('Failed to filter jobs with AI');
    }
  }

  /**
   * Get personalized job recommendations based on user profile
   */
  async getJobRecommendations(
    request: AIJobRecommendationRequestDto,
  ): Promise<JobRecommendationResult> {
    const startTime = Date.now();
    let totalCost = 0;

    try {
      // Validate request
      if (!request.userProfile) {
        throw new Error('User profile is required for job recommendations');
      }

      this.logger.log('Starting job recommendations', {
        userProfile: request.userProfile,
        limit: request.limit,
      });

      // Get all jobs
      const allJobs = await this.jobRepository.getJobs();
      const recommendations: Array<
        PrismaJob & {
          matchScore: number;
          matchReasons: string[];
          aiAnalysis?: AIAnalysisResponseDto;
        }
      > = [];

      // Analyze jobs and calculate match scores
      for (const job of allJobs) {
        try {
          // Analyze job with AI
          const aiAnalysis = await this.aiService.analyzeJob({
            jobTitle: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary || undefined,
            tags: job.tags || undefined,
          });

          totalCost += aiAnalysis.costEstimate;

          // Calculate match score
          const matchScore = this.calculateMatchScore(
            aiAnalysis.classification,
            request.userProfile,
          );

          this.logger.debug('Match score calculated:', {
            jobId: job.id,
            jobTitle: job.title,
            matchScore,
            minMatchScore: request.minMatchScore || 0.6,
            classification: aiAnalysis.classification,
          });

          // Only include jobs above minimum match score
          if (matchScore >= (request.minMatchScore || 0.6)) {
            const matchReasons = this.generateMatchReasons(
              aiAnalysis.classification,
              request.userProfile,
            );

            recommendations.push({
              ...job,
              matchScore,
              matchReasons,
              aiAnalysis,
            });
          }
        } catch (error) {
          this.logger.warn('Failed to analyze job for recommendations:', {
            jobId: job.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue with next job instead of failing completely
        }
      }

      // Sort by match score and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, request.limit || 10);

      // Generate summary
      const summary = this.generateRecommendationSummary(
        sortedRecommendations,
        allJobs.length,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log('Job recommendations completed', {
        totalJobs: allJobs.length,
        recommendations: sortedRecommendations.length,
        processingTime,
        totalCost,
        averageMatchScore: summary.averageMatchScore,
      });

      return {
        recommendations: sortedRecommendations,
        processingTime,
        totalCost,
        summary,
      };
    } catch (error) {
      this.logger.error('Error generating job recommendations:', error);
      throw new Error(
        `Failed to generate job recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Apply traditional filters to jobs
   */
  private applyTraditionalFilters(
    jobs: PrismaJob[],
    filters?: {
      status?: string;
      company?: string;
      location?: string;
      search?: string;
    },
  ): PrismaJob[] {
    if (!filters) return jobs;

    return jobs.filter((job) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        switch (key) {
          case 'status':
            return job.status === value;
          case 'company':
            return job.company.toLowerCase().includes(value.toLowerCase());
          case 'location':
            return job.location.toLowerCase().includes(value.toLowerCase());
          case 'search':
            return job.searchText?.toLowerCase().includes(value.toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  /**
   * Apply AI filters to jobs
   */
  private async applyAIFilters(
    jobs: PrismaJob[],
    aiFilters: AIJobFilterDto,
  ): Promise<{
    jobs: JobWithAIAnalysis[];
    totalCost: number;
    jobsAnalyzed: number;
  }> {
    const filteredJobs: JobWithAIAnalysis[] = [];
    let totalCost = 0;
    let jobsAnalyzed = 0;
    const maxJobsToAnalyze = aiFilters.maxJobsToAnalyze || 50;

    for (const job of jobs.slice(0, maxJobsToAnalyze)) {
      try {
        // Analyze job with AI
        const aiAnalysis = await this.aiService.analyzeJob({
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || undefined,
          tags: job.tags || undefined,
        });

        totalCost += aiAnalysis.costEstimate;
        jobsAnalyzed++;

        // Apply AI filters
        if (this.matchesAIFilters(aiAnalysis.classification, aiFilters)) {
          filteredJobs.push({
            ...job,
            aiAnalysis,
          });
        }
      } catch (error) {
        this.logger.warn('Failed to analyze job for filtering:', {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { jobs: filteredJobs, totalCost, jobsAnalyzed };
  }

  /**
   * Check if job matches AI filters
   */
  private matchesAIFilters(
    classification: AIAnalysisResponseDto['classification'],
    filters: AIJobFilterDto,
  ): boolean {
    // Check confidence
    if (
      filters.minConfidence &&
      classification.confidence < filters.minConfidence
    ) {
      return false;
    }

    // Check seniority level
    if (
      filters.seniorityLevel &&
      classification.seniorityLevel !== filters.seniorityLevel
    ) {
      return false;
    }

    // Check required skills
    if (filters.requiredSkills && filters.requiredSkills.length > 0) {
      const jobSkills = classification.requiredSkills.map((skill) =>
        skill.toLowerCase(),
      );
      const requiredSkills = filters.requiredSkills.map((skill) =>
        skill.toLowerCase(),
      );
      const hasAllSkills = requiredSkills.every((skill) =>
        jobSkills.some(
          (jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill),
        ),
      );
      if (!hasAllSkills) return false;
    }

    // Check remote type
    if (
      filters.remoteType &&
      classification.remoteType !== filters.remoteType
    ) {
      return false;
    }

    // Check job type
    if (filters.jobType && classification.jobType !== filters.jobType) {
      return false;
    }

    // Check company size
    if (
      filters.companySize &&
      classification.companySize !== filters.companySize
    ) {
      return false;
    }

    return true;
  }

  /**
   * Apply pagination to results
   */
  private applyPagination(
    jobs: JobWithAIAnalysis[],
    pagination?: { limit?: number; skip?: number },
  ): JobWithAIAnalysis[] {
    const skip = pagination?.skip || 0;
    const limit = pagination?.limit || 10;
    return jobs.slice(skip, skip + limit);
  }

  /**
   * Calculate match score between job and user profile
   */
  private calculateMatchScore(
    classification: AIAnalysisResponseDto['classification'],
    userProfile: UserProfileDto,
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Seniority level match (weight: 0.3)
    if (
      userProfile.preferredSeniorityLevel &&
      classification.seniorityLevel === userProfile.preferredSeniorityLevel
    ) {
      score += 0.3;
    }
    totalWeight += 0.3;

    // Skills match (weight: 0.25)
    if (userProfile.preferredSkills && userProfile.preferredSkills.length > 0) {
      const jobSkills = classification.requiredSkills.map((skill) =>
        skill.toLowerCase(),
      );
      const userSkills = userProfile.preferredSkills.map((skill) =>
        skill.toLowerCase(),
      );
      const matchingSkills = userSkills.filter((skill) =>
        jobSkills.some(
          (jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill),
        ),
      );
      const skillMatchRatio = matchingSkills.length / userSkills.length;
      score += 0.25 * skillMatchRatio;
    }
    totalWeight += 0.25;

    // Remote type match (weight: 0.2)
    if (
      userProfile.preferredRemoteType &&
      classification.remoteType === userProfile.preferredRemoteType
    ) {
      score += 0.2;
    }
    totalWeight += 0.2;

    // Job type match (weight: 0.15)
    if (
      userProfile.preferredJobType &&
      classification.jobType === userProfile.preferredJobType
    ) {
      score += 0.15;
    }
    totalWeight += 0.15;

    // Company size match (weight: 0.1)
    if (
      userProfile.preferredCompanySize &&
      classification.companySize === userProfile.preferredCompanySize
    ) {
      score += 0.1;
    }
    totalWeight += 0.1;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Generate match reasons for recommendations
   */
  private generateMatchReasons(
    classification: AIAnalysisResponseDto['classification'],
    userProfile: UserProfileDto,
  ): string[] {
    const reasons: string[] = [];

    if (
      userProfile.preferredSeniorityLevel &&
      classification.seniorityLevel === userProfile.preferredSeniorityLevel
    ) {
      reasons.push(
        `Matches your preferred seniority level (${classification.seniorityLevel})`,
      );
    }

    if (userProfile.preferredSkills && userProfile.preferredSkills.length > 0) {
      const jobSkills = classification.requiredSkills.map((skill) =>
        skill.toLowerCase(),
      );
      const userSkills = userProfile.preferredSkills.map((skill) =>
        skill.toLowerCase(),
      );
      const matchingSkills = userSkills.filter((skill) =>
        jobSkills.some(
          (jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill),
        ),
      );
      if (matchingSkills.length > 0) {
        reasons.push(
          `Uses your preferred skills: ${matchingSkills.join(', ')}`,
        );
      }
    }

    if (
      userProfile.preferredRemoteType &&
      classification.remoteType === userProfile.preferredRemoteType
    ) {
      reasons.push(
        `Offers your preferred work arrangement (${classification.remoteType})`,
      );
    }

    if (
      userProfile.preferredJobType &&
      classification.jobType === userProfile.preferredJobType
    ) {
      reasons.push(
        `Matches your preferred job type (${classification.jobType})`,
      );
    }

    if (
      userProfile.preferredCompanySize &&
      classification.companySize === userProfile.preferredCompanySize
    ) {
      reasons.push(
        `Matches your preferred company size (${classification.companySize})`,
      );
    }

    return reasons;
  }

  /**
   * Generate filter summary
   */
  private generateFilterSummary(jobs: JobWithAIAnalysis[]): {
    appliedFilters: string[];
    confidenceDistribution: Record<string, number>;
    seniorityDistribution: Record<string, number>;
    remoteTypeDistribution: Record<string, number>;
  } {
    const appliedFilters: string[] = [];
    const confidenceDistribution: Record<string, number> = {};
    const seniorityDistribution: Record<string, number> = {};
    const remoteTypeDistribution: Record<string, number> = {};

    jobs.forEach((job) => {
      if (job.aiAnalysis) {
        const confidence = job.aiAnalysis.classification.confidence;
        const confidenceRange =
          confidence < 0.5 ? 'low' : confidence < 0.8 ? 'medium' : 'high';
        confidenceDistribution[confidenceRange] =
          (confidenceDistribution[confidenceRange] || 0) + 1;

        const seniority = job.aiAnalysis.classification.seniorityLevel;
        seniorityDistribution[seniority] =
          (seniorityDistribution[seniority] || 0) + 1;

        const remoteType = job.aiAnalysis.classification.remoteType;
        remoteTypeDistribution[remoteType] =
          (remoteTypeDistribution[remoteType] || 0) + 1;
      }
    });

    return {
      appliedFilters,
      confidenceDistribution,
      seniorityDistribution,
      remoteTypeDistribution,
    };
  }

  /**
   * Generate recommendation summary
   */
  private generateRecommendationSummary(
    recommendations: Array<
      PrismaJob & { matchScore: number; matchReasons: string[] }
    >,
    totalJobsAnalyzed: number,
  ): {
    totalJobsAnalyzed: number;
    averageMatchScore: number;
    topMatchReasons: string[];
  } {
    const averageMatchScore =
      recommendations.length > 0
        ? recommendations.reduce((sum, job) => sum + job.matchScore, 0) /
          recommendations.length
        : 0;

    const allReasons = recommendations.flatMap((job) => job.matchReasons);
    const reasonCounts: Record<string, number> = {};
    allReasons.forEach((reason) => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const topMatchReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);

    return {
      totalJobsAnalyzed,
      averageMatchScore,
      topMatchReasons,
    };
  }
}
