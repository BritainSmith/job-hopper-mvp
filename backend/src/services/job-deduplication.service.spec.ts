import { Test, TestingModule } from '@nestjs/testing';
import {
  JobDeduplicationService,
  DeduplicationOptions,
} from './job-deduplication.service';
import { JobRepository } from '../repositories/job.repository';
import { Job, JobStatus } from '@prisma/client';

describe('JobDeduplicationService', () => {
  let service: JobDeduplicationService;
  let jobRepository: jest.Mocked<JobRepository>;

  // Mock job data for testing
  const mockJob1: Job = {
    id: 1,
    title: 'Senior React Developer',
    company: 'TechCorp',
    location: 'Remote',
    applyLink: 'https://techcorp.com/job1',
    postedDate: '2023-07-01',
    salary: '$100k - $150k',
    applied: false,
    appliedAt: null,
    status: JobStatus.ACTIVE,
    source: 'linkedin',
    dateScraped: new Date('2023-07-01'),
    lastUpdated: new Date('2023-07-01'),
    tags: 'React,TypeScript,Node.js',
    searchText: 'senior react developer techcorp remote',
    companyId: null,
  };

  const mockJob2: Job = {
    id: 2,
    title: 'Senior React Developer',
    company: 'TechCorp',
    location: 'Remote',
    applyLink: 'https://techcorp.com/job2',
    postedDate: '2023-07-02',
    salary: '$100k - $150k',
    applied: false,
    appliedAt: null,
    status: JobStatus.ACTIVE,
    source: 'remoteok',
    dateScraped: new Date('2023-07-02'),
    lastUpdated: new Date('2023-07-02'),
    tags: 'React,TypeScript,Node.js',
    searchText: 'senior react developer techcorp remote',
    companyId: null,
  };

  const mockJob3: Job = {
    id: 3,
    title: 'Frontend Developer',
    company: 'StartupInc',
    location: 'San Francisco, CA',
    applyLink: 'https://startupinc.com/job3',
    postedDate: '2023-07-03',
    salary: '$80k - $120k',
    applied: false,
    appliedAt: null,
    status: JobStatus.ACTIVE,
    source: 'arbeitnow',
    dateScraped: new Date('2023-07-03'),
    lastUpdated: new Date('2023-07-03'),
    tags: 'React,JavaScript',
    searchText: 'frontend developer startupinc san francisco',
    companyId: null,
  };

  beforeEach(async () => {
    const mockJobRepository = {
      getJobs: jest.fn(),
      createJob: jest.fn(),
      updateJob: jest.fn(),
      deleteJob: jest.fn(),
      getJobById: jest.fn(),
      upsertJob: jest.fn(),
      getJobStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobDeduplicationService,
        {
          provide: JobRepository,
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<JobDeduplicationService>(JobDeduplicationService);
    jobRepository = module.get(JobRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkForDuplicates', () => {
    it('should return no duplicates when no similar jobs exist', async () => {
      // Arrange
      const newJob = {
        title: 'Unique Job Title',
        company: 'Unique Company',
        location: 'Remote',
        applyLink: 'https://unique.com/job',
        source: 'linkedin',
      };

      jobRepository.getJobs.mockResolvedValue([]);

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(1.0);
      expect(result.similarJobs).toHaveLength(0);
      expect(result.recommendedAction).toBe('create');
      expect(result.reason).toBe('No similar jobs found');
    });

    it('should detect exact apply link duplicates with high confidence', async () => {
      // Arrange
      const newJob = {
        title: 'Different Title',
        company: 'Different Company',
        location: 'Different Location',
        applyLink: 'https://techcorp.com/job1', // Same as mockJob1
        source: 'remoteok',
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([mockJob1]) // Apply link search
        .mockResolvedValueOnce([]) // Title/company search
        .mockResolvedValueOnce([]) // Fuzzy search - first term
        .mockResolvedValueOnce([]) // Fuzzy search - second term
        .mockResolvedValueOnce([]) // Fuzzy search - third term
        .mockResolvedValueOnce([]); // Location search

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.similarJobs).toHaveLength(1);
      expect(result.similarJobs[0].matchedFields).toContain('applyLink');
    });

    it('should detect title and company matches', async () => {
      // Arrange
      const newJob = {
        title: 'Senior React Developer', // Same as mockJob1
        company: 'TechCorp', // Same as mockJob1
        location: 'New York', // Different location
        applyLink: 'https://different.com/job',
        source: 'arbeitnow',
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([]) // Apply link search
        .mockResolvedValueOnce([mockJob1]) // Title/company search
        .mockResolvedValueOnce([]) // Fuzzy search - first term
        .mockResolvedValueOnce([]) // Fuzzy search - second term
        .mockResolvedValueOnce([]) // Fuzzy search - third term
        .mockResolvedValueOnce([]); // Location search

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.similarJobs).toHaveLength(1);
      expect(result.similarJobs[0].matchedFields).toContain('title');
      expect(result.similarJobs[0].matchedFields).toContain('company');
    });

    it('should handle fuzzy matching for similar titles', async () => {
      // Arrange
      const newJob = {
        title: 'Senior React Developer (Remote)',
        company: 'TechCorp',
        location: 'Remote',
        applyLink: 'https://different.com/job',
        source: 'linkedin',
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([]) // Apply link search
        .mockResolvedValueOnce([]) // Title/company search
        .mockResolvedValueOnce([]) // Fuzzy search - first term
        .mockResolvedValueOnce([]) // Fuzzy search - second term
        .mockResolvedValueOnce([mockJob1]) // Fuzzy search - third term
        .mockResolvedValueOnce([]); // Location search

      // Act
      const result = await service.checkForDuplicates(newJob, {
        minSimilarityScore: 0.55, // Lower threshold for fuzzy matching test
      });

      // Assert
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.55); // Lower threshold for fuzzy matching
      expect(result.similarJobs).toHaveLength(1);
    });

    it('should handle location-based matching for remote jobs', async () => {
      // Arrange
      const newJob = {
        title: 'Different Title',
        company: 'Different Company',
        location: 'Remote', // Same as mockJob1
        applyLink: 'https://different.com/job',
        source: 'remoteok',
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([]) // Apply link search
        .mockResolvedValueOnce([]) // Title/company search
        .mockResolvedValueOnce([]) // Fuzzy search - first term
        .mockResolvedValueOnce([]) // Fuzzy search - second term
        .mockResolvedValueOnce([]) // Fuzzy search - third term
        .mockResolvedValueOnce([mockJob1]); // Location search

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(false); // Low confidence due to different title/company
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should respect custom deduplication options', async () => {
      // Arrange
      const newJob = {
        title: 'Senior React Developer',
        company: 'TechCorp',
        location: 'Remote',
        applyLink: 'https://different.com/job',
        source: 'linkedin',
      };

      const options: DeduplicationOptions = {
        minSimilarityScore: 0.98, // Very high threshold
        enableFuzzyMatching: false, // Disable fuzzy matching
        checkApplyLink: true,
        checkTitleCompany: true,
        checkLocation: false, // Disable location checking
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([]) // Apply link search
        .mockResolvedValueOnce([mockJob1]); // Title/company search

      // Act
      const result = await service.checkForDuplicates(newJob, options);

      // Assert
      expect(result.isDuplicate).toBe(false); // Should not be duplicate due to higher threshold
      expect(jobRepository.getJobs).toHaveBeenCalledTimes(2); // Only apply link and title/company searches
    });

    it('should handle multiple similar jobs and return best match', async () => {
      // Arrange
      const newJob = {
        title: 'Senior React Developer',
        company: 'TechCorp',
        location: 'Remote',
        applyLink: 'https://different.com/job',
        source: 'linkedin',
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([]) // Apply link search
        .mockResolvedValueOnce([mockJob1, mockJob2]) // Title/company search
        .mockResolvedValueOnce([]) // Fuzzy search - first term
        .mockResolvedValueOnce([]) // Fuzzy search - second term
        .mockResolvedValueOnce([]) // Fuzzy search - third term
        .mockResolvedValueOnce([]); // Location search

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(true);
      expect(result.similarJobs).toHaveLength(2);
      expect(result.similarJobs[0].score).toBeGreaterThanOrEqual(
        result.similarJobs[1].score,
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const newJob = {
        title: 'Test Job',
        company: 'Test Company',
        location: 'Remote',
        applyLink: 'https://test.com/job',
        source: 'linkedin',
      };

      jobRepository.getJobs.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.checkForDuplicates(newJob)).rejects.toThrow(
        'Failed to check for duplicates',
      );
    });
  });

  describe('processJobsWithDeduplication', () => {
    it('should process multiple jobs and return statistics', async () => {
      // Arrange
      const jobs = [
        {
          title: 'Job 1',
          company: 'Company 1',
          location: 'Remote',
          applyLink: 'https://company1.com/job1',
          source: 'linkedin',
        },
        {
          title: 'Job 2',
          company: 'Company 2',
          location: 'Remote',
          applyLink: 'https://company2.com/job2',
          source: 'remoteok',
        },
      ];

      jobRepository.getJobs.mockResolvedValue([]); // No duplicates found

      // Act
      const stats = await service.processJobsWithDeduplication(jobs);

      // Assert
      expect(stats.totalJobsProcessed).toBe(2);
      expect(stats.duplicatesFound).toBe(0);
      expect(stats.jobsCreated).toBe(2);
      expect(stats.jobsUpdated).toBe(0);
      expect(stats.jobsSkipped).toBe(0);
      expect(stats.processingTimeMs).toBeGreaterThan(0);
    });

    it('should handle mixed results (duplicates and new jobs)', async () => {
      // Arrange
      const jobs = [
        {
          title: 'Senior React Developer',
          company: 'TechCorp',
          location: 'Remote',
          applyLink: 'https://techcorp.com/job1',
          source: 'linkedin',
        },
        {
          title: 'Unique Job',
          company: 'Unique Company',
          location: 'Remote',
          applyLink: 'https://unique.com/job',
          source: 'remoteok',
        },
      ];

      jobRepository.getJobs
        .mockResolvedValueOnce([mockJob1]) // First job - apply link search
        .mockResolvedValueOnce([]) // First job - title/company search
        .mockResolvedValueOnce([]) // First job - fuzzy search - first term
        .mockResolvedValueOnce([]) // First job - fuzzy search - second term
        .mockResolvedValueOnce([]) // First job - fuzzy search - third term
        .mockResolvedValueOnce([]) // First job - location search
        .mockResolvedValueOnce([]) // Second job - apply link search
        .mockResolvedValueOnce([]) // Second job - title/company search
        .mockResolvedValueOnce([]) // Second job - fuzzy search - first term
        .mockResolvedValueOnce([]) // Second job - fuzzy search - second term
        .mockResolvedValueOnce([]) // Second job - fuzzy search - third term
        .mockResolvedValueOnce([]); // Second job - location search

      // Act
      const stats = await service.processJobsWithDeduplication(jobs);

      // Assert
      expect(stats.totalJobsProcessed).toBe(2);
      expect(stats.duplicatesFound).toBe(1);
      expect(stats.jobsCreated).toBe(1);
      expect(stats.jobsSkipped).toBe(1);
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      const jobs = [
        {
          title: 'Job 1',
          company: 'Company 1',
          location: 'Remote',
          applyLink: 'https://company1.com/job1',
          source: 'linkedin',
        },
      ];

      jobRepository.getJobs.mockRejectedValue(new Error('Database error'));

      // Act
      const stats = await service.processJobsWithDeduplication(jobs);

      // Assert
      expect(stats.totalJobsProcessed).toBe(1);
      expect(stats.jobsSkipped).toBe(1);
      expect(stats.jobsCreated).toBe(0);
    });
  });

  describe('getDeduplicationStats', () => {
    it('should return statistics for existing jobs', async () => {
      // Arrange
      const allJobs = [mockJob1, mockJob2, mockJob3];
      jobRepository.getJobs.mockResolvedValue(allJobs);

      // Act
      const stats = await service.getDeduplicationStats();

      // Assert
      expect(stats.totalJobs).toBe(3);
      expect(stats.potentialDuplicates).toBe(1); // mockJob1 and mockJob2 have same title/company
      expect(stats.duplicateGroups).toBe(1);
      expect(stats.averageSimilarityScore).toBe(0);
    });

    it('should handle empty job list', async () => {
      // Arrange
      jobRepository.getJobs.mockResolvedValue([]);

      // Act
      const stats = await service.getDeduplicationStats();

      // Assert
      expect(stats.totalJobs).toBe(0);
      expect(stats.potentialDuplicates).toBe(0);
      expect(stats.duplicateGroups).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      jobRepository.getJobs.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getDeduplicationStats()).rejects.toThrow(
        'Failed to get deduplication statistics',
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle jobs with missing optional fields', async () => {
      // Arrange
      const newJob = {
        title: 'Test Job',
        company: 'Test Company',
        location: 'Remote',
        applyLink: 'https://test.com/job',
        source: 'linkedin',
        // Missing optional fields: salary, tags, postedDate
      };

      jobRepository.getJobs.mockResolvedValue([]);

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle jobs with null/undefined values', async () => {
      // Arrange
      const newJob = {
        title: 'Test Job',
        company: 'Test Company',
        location: null as any,
        applyLink: 'https://test.com/job',
        source: 'linkedin',
        salary: null as any,
        tags: null as any,
      };

      jobRepository.getJobs.mockResolvedValue([]);

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle case-insensitive matching', async () => {
      // Arrange
      const newJob = {
        title: 'SENIOR REACT DEVELOPER',
        company: 'TECHCORP',
        location: 'REMOTE',
        applyLink: 'https://techcorp.com/job1',
        source: 'linkedin',
      };

      jobRepository.getJobs
        .mockResolvedValueOnce([mockJob1]) // Apply link search
        .mockResolvedValueOnce([]) // Title/company search
        .mockResolvedValueOnce([]) // Fuzzy search - first term
        .mockResolvedValueOnce([]) // Fuzzy search - second term
        .mockResolvedValueOnce([]) // Fuzzy search - third term
        .mockResolvedValueOnce([]); // Location search

      // Act
      const result = await service.checkForDuplicates(newJob);

      // Assert
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});
