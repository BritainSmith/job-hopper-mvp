import { Injectable, Logger } from '@nestjs/common';
import { Job as PrismaJob, Prisma } from '@prisma/client';
import { JobRepository } from '../repositories/job.repository';
import { IJobDeduplicationService } from '../interfaces/job-deduplication.service.interface';

// Strong typing for deduplication
export interface JobSimilarityScore {
  jobId: number;
  score: number;
  reason: string;
  matchedFields: string[];
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number;
  similarJobs: JobSimilarityScore[];
  recommendedAction: 'create' | 'update' | 'skip';
  reason: string;
}

export interface DeduplicationOptions {
  minSimilarityScore?: number;
  enableFuzzyMatching?: boolean;
  checkApplyLink?: boolean;
  checkTitleCompany?: boolean;
  checkLocation?: boolean;
  checkSalary?: boolean;
  enableAIReady?: boolean;
}

export interface JobComparisonData {
  title: string;
  company: string;
  location: string;
  applyLink: string;
  salary?: string;
  tags?: string;
  source: string;
}

export interface DeduplicationStats {
  totalJobsProcessed: number;
  duplicatesFound: number;
  jobsCreated: number;
  jobsUpdated: number;
  jobsSkipped: number;
  averageSimilarityScore: number;
  processingTimeMs: number;
}

@Injectable()
export class JobDeduplicationService implements IJobDeduplicationService {
  private readonly logger = new Logger(JobDeduplicationService.name);

  // Default configuration
  private readonly DEFAULT_OPTIONS: Required<DeduplicationOptions> = {
    minSimilarityScore: 0.8,
    enableFuzzyMatching: true,
    checkApplyLink: true,
    checkTitleCompany: true,
    checkLocation: true,
    checkSalary: false, // Less reliable for deduplication
    enableAIReady: true,
  };

  constructor(private jobRepository: JobRepository) {}

  /**
   * Main deduplication method - determines if a job is a duplicate
   */
  async checkForDuplicates(
    jobData: Prisma.JobCreateInput,
    options: DeduplicationOptions = {},
  ): Promise<DeduplicationResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      this.logger.debug('Checking for duplicates', {
        jobTitle: jobData.title,
        company: jobData.company,
        source: jobData.source,
      });

      // Get potential duplicates using multiple strategies
      const potentialDuplicates = await this.findPotentialDuplicates(
        jobData,
        config,
      );

      if (potentialDuplicates.length === 0) {
        return {
          isDuplicate: false,
          confidence: 1.0,
          similarJobs: [],
          recommendedAction: 'create',
          reason: 'No similar jobs found',
        };
      }

      // Calculate similarity scores
      const similarityScores = this.calculateSimilarityScores(
        jobData,
        potentialDuplicates,
        config,
      );

      // Find the best match
      const bestMatch = similarityScores.reduce((best, current) =>
        current.score > best.score ? current : best,
      );

      // Determine if it's a duplicate based on confidence
      const isDuplicate = bestMatch.score >= config.minSimilarityScore;

      const result: DeduplicationResult = {
        isDuplicate,
        confidence: bestMatch.score,
        similarJobs: similarityScores,
        recommendedAction: this.determineRecommendedAction(
          isDuplicate,
          bestMatch,
          config,
        ),
        reason: this.generateReason(bestMatch, isDuplicate),
      };

      this.logger.debug('Deduplication result', {
        isDuplicate: result.isDuplicate,
        confidence: result.confidence,
        recommendedAction: result.recommendedAction,
        reason: result.reason,
      });

      return result;
    } catch (error) {
      this.logger.error('Error during deduplication check:', error);
      throw new Error('Failed to check for duplicates');
    }
  }

  /**
   * Process multiple jobs with deduplication
   */
  async processJobsWithDeduplication(
    jobs: Prisma.JobCreateInput[],
    options: DeduplicationOptions = {},
  ): Promise<DeduplicationStats> {
    const startTime = Date.now();
    const stats: DeduplicationStats = {
      totalJobsProcessed: jobs.length,
      duplicatesFound: 0,
      jobsCreated: 0,
      jobsUpdated: 0,
      jobsSkipped: 0,
      averageSimilarityScore: 0,
      processingTimeMs: 0,
    };

    let totalSimilarityScore = 0;
    let processedCount = 0;

    for (const jobData of jobs) {
      try {
        const result = await this.checkForDuplicates(jobData, options);

        if (result.isDuplicate) {
          stats.duplicatesFound++;
          if (result.recommendedAction === 'update') {
            stats.jobsUpdated++;
          } else {
            stats.jobsSkipped++;
          }
        } else {
          stats.jobsCreated++;
        }

        totalSimilarityScore += result.confidence;
        processedCount++;
      } catch (error) {
        this.logger.warn('Failed to process job for deduplication:', error);
        stats.jobsSkipped++;
      }
    }

    stats.averageSimilarityScore =
      processedCount > 0 ? totalSimilarityScore / processedCount : 0;

    // Ensure minimum processing time for accurate measurement
    const elapsedTime = Date.now() - startTime;
    stats.processingTimeMs = Math.max(elapsedTime, 1);

    this.logger.log('Deduplication processing completed', stats);
    return stats;
  }

  /**
   * Find potential duplicates using multiple strategies
   */
  private async findPotentialDuplicates(
    jobData: Prisma.JobCreateInput,
    config: Required<DeduplicationOptions>,
  ): Promise<PrismaJob[]> {
    const duplicates: PrismaJob[] = [];

    // Strategy 1: Exact apply link match (highest confidence)
    if (config.checkApplyLink && jobData.applyLink) {
      // Use searchText to find jobs with the same apply link
      const linkMatches = await this.jobRepository.getJobs({
        searchText: jobData.applyLink,
      });
      // Filter to exact apply link matches
      const exactLinkMatches = linkMatches.filter(
        (job) => job.applyLink === jobData.applyLink,
      );
      duplicates.push(...exactLinkMatches);
    }

    // Strategy 2: Title and company match
    if (config.checkTitleCompany && jobData.title && jobData.company) {
      const titleCompanyMatches = await this.jobRepository.getJobs({
        company: jobData.company,
        searchText: jobData.title,
      });
      // Filter to exact title matches
      const exactTitleMatches = titleCompanyMatches.filter(
        (job) => job.title === jobData.title,
      );
      duplicates.push(...exactTitleMatches);
    }

    // Strategy 3: Fuzzy matching on title and company
    if (config.enableFuzzyMatching && jobData.title && jobData.company) {
      const fuzzyMatches = await this.findFuzzyMatches(jobData);
      duplicates.push(...fuzzyMatches);
    }

    // Strategy 4: Location-based matching for remote jobs
    if (config.checkLocation && jobData.location) {
      const locationMatches = await this.findLocationMatches(jobData);
      duplicates.push(...locationMatches);
    }

    // Remove duplicates and return unique jobs
    return this.removeDuplicateJobs(duplicates);
  }

  /**
   * Calculate similarity scores between jobs
   */
  private calculateSimilarityScores(
    jobData: Prisma.JobCreateInput,
    potentialDuplicates: PrismaJob[],
    config: Required<DeduplicationOptions>,
  ): JobSimilarityScore[] {
    const scores: JobSimilarityScore[] = [];

    for (const existingJob of potentialDuplicates) {
      const score = this.calculateJobSimilarity(jobData, existingJob, config);
      scores.push({
        jobId: existingJob.id,
        score,
        reason: this.generateSimilarityReason(jobData, existingJob, score),
        matchedFields: this.getMatchedFields(jobData, existingJob),
      });
    }

    // Sort by score (highest first)
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate similarity between two jobs
   */
  private calculateJobSimilarity(
    jobData: Prisma.JobCreateInput,
    existingJob: PrismaJob,
    config: Required<DeduplicationOptions>,
  ): number {
    // Special case: exact apply link match = 100% confidence
    if (config.checkApplyLink && jobData.applyLink === existingJob.applyLink) {
      return 1.0;
    }

    // Special case: exact title and company match = 95% confidence
    if (
      config.checkTitleCompany &&
      jobData.title === existingJob.title &&
      jobData.company === existingJob.company
    ) {
      return 0.95;
    }

    let totalScore = 0;
    let maxScore = 0;

    // Apply link match (highest weight)
    if (config.checkApplyLink) {
      const linkScore = jobData.applyLink === existingJob.applyLink ? 1.0 : 0.0;
      totalScore += linkScore * 0.4; // 40% weight
      maxScore += 0.4;
    }

    // Title similarity
    if (config.checkTitleCompany && jobData.title) {
      const titleScore = this.calculateStringSimilarity(
        jobData.title,
        existingJob.title,
      );
      totalScore += titleScore * 0.3; // 30% weight
      maxScore += 0.3;
    }

    // Company similarity
    if (config.checkTitleCompany && jobData.company) {
      const companyScore = this.calculateStringSimilarity(
        jobData.company,
        existingJob.company,
      );
      totalScore += companyScore * 0.2; // 20% weight
      maxScore += 0.2;
    }

    // Location similarity
    if (config.checkLocation && jobData.location) {
      const locationScore = this.calculateLocationSimilarity(
        jobData.location,
        existingJob.location,
      );
      totalScore += locationScore * 0.1; // 10% weight
      maxScore += 0.1;
    }

    return maxScore > 0 ? totalScore / maxScore : 0;
  }

  /**
   * Calculate string similarity using simple algorithms
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    // Word-based similarity
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter((word) => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);

    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Calculate location similarity (handles remote vs specific locations)
   */
  private calculateLocationSimilarity(loc1: string, loc2: string): number {
    if (!loc1 || !loc2) return 0;

    const l1 = loc1.toLowerCase().trim();
    const l2 = loc2.toLowerCase().trim();

    // Exact match
    if (l1 === l2) return 1.0;

    // Both remote
    if (
      (l1.includes('remote') || l1 === 'remote') &&
      (l2.includes('remote') || l2 === 'remote')
    ) {
      return 0.9;
    }

    // One remote, one specific
    if (
      l1.includes('remote') ||
      l1 === 'remote' ||
      l2.includes('remote') ||
      l2 === 'remote'
    ) {
      return 0.3; // Lower similarity for remote vs specific
    }

    // Both specific locations - check for city/state matches
    const words1 = l1.split(/[,\s]+/);
    const words2 = l2.split(/[,\s]+/);
    const commonWords = words1.filter((word) => words2.includes(word));

    return commonWords.length > 0 ? 0.7 : 0.1;
  }

  /**
   * Find fuzzy matches using search text
   */
  private async findFuzzyMatches(
    jobData: Prisma.JobCreateInput,
  ): Promise<PrismaJob[]> {
    if (!jobData.title || !jobData.company) return [];

    const searchTerms = [
      jobData.title,
      jobData.company,
      `${jobData.title} ${jobData.company}`,
    ];

    const matches: PrismaJob[] = [];
    for (const term of searchTerms) {
      const results = await this.jobRepository.getJobs({
        searchText: term,
      });
      matches.push(...results);
    }

    return this.removeDuplicateJobs(matches);
  }

  /**
   * Find location-based matches
   */
  private async findLocationMatches(
    jobData: Prisma.JobCreateInput,
  ): Promise<PrismaJob[]> {
    if (!jobData.location) return [];

    return await this.jobRepository.getJobs({
      location: jobData.location,
    });
  }

  /**
   * Remove duplicate jobs from array
   */
  private removeDuplicateJobs(jobs: PrismaJob[]): PrismaJob[] {
    const seen = new Set<number>();
    return jobs.filter((job) => {
      if (seen.has(job.id)) {
        return false;
      }
      seen.add(job.id);
      return true;
    });
  }

  /**
   * Determine recommended action based on similarity
   */
  private determineRecommendedAction(
    isDuplicate: boolean,
    bestMatch: JobSimilarityScore,
    config: Required<DeduplicationOptions>,
  ): 'create' | 'update' | 'skip' {
    if (!isDuplicate) return 'create';

    if (bestMatch.score >= 0.95) return 'skip'; // Very high confidence duplicate
    if (bestMatch.score >= config.minSimilarityScore) return 'update'; // Update existing

    return 'create'; // Below threshold, create new
  }

  /**
   * Generate human-readable reason for deduplication decision
   */
  private generateReason(
    bestMatch: JobSimilarityScore,
    isDuplicate: boolean,
  ): string {
    if (bestMatch.score === 0) {
      return 'No similar jobs found';
    }

    const confidence = Math.round(bestMatch.score * 100);
    if (isDuplicate) {
      return `Found similar job (${confidence}% match): ${bestMatch.reason}`;
    } else {
      return `Found similar job but below threshold (${confidence}% match): ${bestMatch.reason}`;
    }
  }

  /**
   * Generate similarity reason
   */
  private generateSimilarityReason(
    jobData: Prisma.JobCreateInput,
    existingJob: PrismaJob,
    score: number,
  ): string {
    const reasons: string[] = [];

    if (jobData.applyLink === existingJob.applyLink) {
      reasons.push('same apply link');
    }
    if (jobData.title === existingJob.title) {
      reasons.push('same title');
    }
    if (jobData.company === existingJob.company) {
      reasons.push('same company');
    }
    if (jobData.location === existingJob.location) {
      reasons.push('same location');
    }

    return reasons.length > 0
      ? reasons.join(', ')
      : `similar content (${Math.round(score * 100)}% match)`;
  }

  /**
   * Get matched fields between jobs
   */
  private getMatchedFields(
    jobData: Prisma.JobCreateInput,
    existingJob: PrismaJob,
  ): string[] {
    const matched: string[] = [];

    if (jobData.applyLink === existingJob.applyLink) {
      matched.push('applyLink');
    }
    if (jobData.title === existingJob.title) {
      matched.push('title');
    }
    if (jobData.company === existingJob.company) {
      matched.push('company');
    }
    if (jobData.location === existingJob.location) {
      matched.push('location');
    }

    return matched;
  }

  /**
   * Get deduplication statistics for existing jobs
   */
  async getDeduplicationStats(): Promise<{
    totalJobs: number;
    potentialDuplicates: number;
    duplicateGroups: number;
    averageSimilarityScore: number;
  }> {
    try {
      const allJobs = await this.jobRepository.getJobs();
      const totalJobs = allJobs.length;

      // Simple duplicate detection for stats
      const duplicateGroups = new Map<string, number>();
      let potentialDuplicates = 0;

      for (const job of allJobs) {
        const key = `${job.title}-${job.company}`;
        const count = duplicateGroups.get(key) || 0;
        duplicateGroups.set(key, count + 1);
        if (count > 0) {
          potentialDuplicates++;
        }
      }

      const groupsWithDuplicates = Array.from(duplicateGroups.values()).filter(
        (count) => count > 1,
      ).length;

      return {
        totalJobs,
        potentialDuplicates,
        duplicateGroups: groupsWithDuplicates,
        averageSimilarityScore: 0, // Would need more complex calculation
      };
    } catch (error) {
      this.logger.error('Error getting deduplication stats:', error);
      throw new Error('Failed to get deduplication statistics');
    }
  }
}
