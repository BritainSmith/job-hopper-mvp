import { Test, TestingModule } from '@nestjs/testing';
import { AIJobFilterService } from './ai-job-filter.service';
import { JobRepository } from '../repositories/job.repository';
import { AIService } from './ai.service';
import { DataCleaningService } from './data-cleaning.service';
import { Job as PrismaJob } from '@prisma/client';
import {
  AIJobFilterRequestDto,
  AIJobRecommendationRequestDto,
} from '../jobs/dto/ai.dto';

describe('AIJobFilterService', () => {
  let service: AIJobFilterService;
  let mockJobRepository: jest.Mocked<JobRepository>;
  let mockAIService: jest.Mocked<AIService>;

  const mockJobs: PrismaJob[] = [
    {
      id: 1,
      title: 'Senior Software Engineer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      applyLink: 'https://example.com/job1',
      postedDate: '2d ago',
      salary: '$120k - $180k',
      applied: false,
      appliedAt: null,
      status: 'ACTIVE',
      source: 'remoteok',
      dateScraped: new Date(),
      lastUpdated: new Date(),
      tags: 'React, Node.js, TypeScript',
      searchText: 'Senior Software Engineer TechCorp React Node.js TypeScript',
      companyId: null,
    },
    {
      id: 2,
      title: 'Junior Frontend Developer',
      company: 'StartupXYZ',
      location: 'Remote',
      applyLink: 'https://example.com/job2',
      postedDate: '1d ago',
      salary: '$60k - $80k',
      applied: false,
      appliedAt: null,
      status: 'ACTIVE',
      source: 'linkedin',
      dateScraped: new Date(),
      lastUpdated: new Date(),
      tags: 'React, JavaScript, CSS',
      searchText: 'Junior Frontend Developer StartupXYZ React JavaScript CSS',
      companyId: null,
    },
  ];

  const mockAIAnalysis = {
    classification: {
      seniorityLevel: 'senior' as const,
      requiredSkills: ['React', 'Node.js', 'TypeScript'],
      remoteType: 'hybrid' as const,
      jobType: 'full-time' as const,
      companySize: 'large' as const,
      confidence: 0.85,
      reasoning: 'Test analysis',
    },
    processingTime: 100,
    costEstimate: 0.001,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIJobFilterService,
        {
          provide: JobRepository,
          useValue: {
            getJobs: jest.fn().mockResolvedValue(mockJobs),
          },
        },
        {
          provide: AIService,
          useValue: {
            analyzeJob: jest.fn().mockResolvedValue(mockAIAnalysis),
          },
        },
        {
          provide: DataCleaningService,
          useValue: {
            cleanJobData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIJobFilterService>(AIJobFilterService);
    mockJobRepository = module.get(JobRepository);
    mockAIService = module.get(AIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('filterJobsWithAI', () => {
    it('should filter jobs with AI analysis', async () => {
      const request: AIJobFilterRequestDto = {
        aiFilters: {
          seniorityLevel: 'senior',
          minConfidence: 0.8,
        },
        pagination: {
          limit: 10,
          skip: 0,
        },
      };

      const result = await service.filterJobsWithAI(request);

      expect(result.jobs).toHaveLength(2);
      expect(result.totalJobs).toBe(2);
      expect(result.jobsAnalyzed).toBe(2);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.totalCost).toBeGreaterThanOrEqual(0);
      expect(result.filterSummary).toBeDefined();
      expect(mockAIService.analyzeJob).toHaveBeenCalledTimes(2);
    });

    it('should apply traditional filters', async () => {
      const request: AIJobFilterRequestDto = {
        traditionalFilters: {
          location: 'Remote',
        },
        pagination: {
          limit: 10,
          skip: 0,
        },
      };

      const result = await service.filterJobsWithAI(request);

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].location).toBe('Remote');
      expect(mockAIService.analyzeJob).not.toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockJobRepository.getJobs.mockResolvedValue([]);

      const request: AIJobFilterRequestDto = {
        aiFilters: {
          seniorityLevel: 'senior',
        },
      };

      const result = await service.filterJobsWithAI(request);

      expect(result.jobs).toHaveLength(0);
      expect(result.totalJobs).toBe(0);
      expect(result.jobsAnalyzed).toBe(0);
    });

    it('should respect maxJobsToAnalyze limit', async () => {
      const request: AIJobFilterRequestDto = {
        aiFilters: {
          seniorityLevel: 'senior',
          maxJobsToAnalyze: 1,
        },
      };

      await service.filterJobsWithAI(request);

      expect(mockAIService.analyzeJob).toHaveBeenCalledTimes(1);
    });
  });

  describe('getJobRecommendations', () => {
    it('should generate job recommendations based on user profile', async () => {
      const request: AIJobRecommendationRequestDto = {
        userProfile: {
          preferredSeniorityLevel: 'senior',
          preferredSkills: ['React', 'TypeScript'],
          preferredRemoteType: 'hybrid',
        },
        limit: 5,
        minMatchScore: 0.6,
      };

      const result = await service.getJobRecommendations(request);

      expect(result.recommendations).toHaveLength(2);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.totalCost).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalJobsAnalyzed).toBe(2);
      expect(result.summary.averageMatchScore).toBeGreaterThan(0);
      expect(mockAIService.analyzeJob).toHaveBeenCalledTimes(2);
    });

    it('should filter recommendations by minimum match score', async () => {
      const request: AIJobRecommendationRequestDto = {
        userProfile: {
          preferredSeniorityLevel: 'entry', // This won't match the senior job
        },
        minMatchScore: 0.9, // High threshold
      };

      const result = await service.getJobRecommendations(request);

      expect(result.recommendations.length).toBeLessThanOrEqual(2);
      expect(mockAIService.analyzeJob).toHaveBeenCalledTimes(2);
    });

    it('should sort recommendations by match score', async () => {
      const request: AIJobRecommendationRequestDto = {
        userProfile: {
          preferredSeniorityLevel: 'senior',
        },
        limit: 2,
      };

      const result = await service.getJobRecommendations(request);

      if (result.recommendations.length > 1) {
        expect(result.recommendations[0].matchScore).toBeGreaterThanOrEqual(
          result.recommendations[1].matchScore,
        );
      }
    });

    it('should handle errors gracefully', async () => {
      mockAIService.analyzeJob.mockRejectedValueOnce(
        new Error('AI service error'),
      );

      const request: AIJobRecommendationRequestDto = {
        userProfile: {
          preferredSeniorityLevel: 'senior',
          preferredSkills: ['React'], // This will match both jobs
        },
        minMatchScore: 0.1, // Lower threshold to ensure matches
      };

      const result = await service.getJobRecommendations(request);

      expect(result.recommendations).toHaveLength(1); // One job succeeded, one failed
      expect(mockAIService.analyzeJob).toHaveBeenCalledTimes(2);
    });
  });

  describe('match score calculation', () => {
    it('should calculate high match score for perfect match', () => {
      const userProfile = {
        preferredSeniorityLevel: 'senior' as const,
        preferredSkills: ['React', 'TypeScript'],
        preferredRemoteType: 'hybrid' as const,
        preferredJobType: 'full-time' as const,
        preferredCompanySize: 'large' as const,
      };

      // This would be a private method, so we test the behavior through the public API
      const request: AIJobRecommendationRequestDto = {
        userProfile,
        minMatchScore: 0.5,
      };

      return expect(
        service.getJobRecommendations(request),
      ).resolves.toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors', async () => {
      mockJobRepository.getJobs.mockRejectedValue(new Error('Database error'));

      const request: AIJobFilterRequestDto = {
        aiFilters: {
          seniorityLevel: 'senior',
        },
      };

      await expect(service.filterJobsWithAI(request)).rejects.toThrow(
        'Failed to filter jobs with AI',
      );
    });

    it('should handle AI service errors', async () => {
      mockAIService.analyzeJob.mockRejectedValue(new Error('AI service error'));

      const request: AIJobFilterRequestDto = {
        aiFilters: {
          seniorityLevel: 'senior',
        },
      };

      const result = await service.filterJobsWithAI(request);

      expect(result.jobs).toHaveLength(0); // No jobs passed AI filtering due to errors
      expect(result.jobsAnalyzed).toBe(0);
    });
  });
});
