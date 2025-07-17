import { JobRepository } from '../repositories/job.repository';
import { IntegrationTestSetup } from './integration-test.setup';
import { TestUtils } from './test-utils';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

describe('JobRepository Integration Tests', () => {
  let jobRepository: JobRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const context = await IntegrationTestSetup.createTestingApp();
    jobRepository = context.module.get<JobRepository>(JobRepository);
    prisma = context.prisma;
  });

  afterAll(async () => {
    await IntegrationTestSetup.closeApp();
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanupDatabase();
  });

  describe('createJob', () => {
    it('should create a new job successfully', async () => {
      // Arrange
      const jobData = TestUtils.generateMockJobData();

      // Act
      const result = await jobRepository.createJob(jobData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(jobData.title);
      expect(result.company).toBe(jobData.company);
      expect(result.applyLink).toBe(jobData.applyLink);
      expect(result.status).toBe(JobStatus.ACTIVE);
      expect(result.applied).toBe(false);
    });

    it('should throw error when creating job with duplicate apply link', async () => {
      // Arrange
      const jobData = TestUtils.generateMockJobData();
      await jobRepository.createJob(jobData);

      // Act & Assert
      await expect(jobRepository.createJob(jobData)).rejects.toThrow();
    });
  });

  describe('getJobById', () => {
    it('should find job by id successfully', async () => {
      // Arrange
      const jobData = TestUtils.generateMockJobData();
      const createdJob = await jobRepository.createJob(jobData);

      // Act
      const result = await jobRepository.getJobById(createdJob.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(createdJob.id);
      expect(result?.title).toBe(jobData.title);
    });

    it('should return null for non-existent job id', async () => {
      // Act
      const result = await jobRepository.getJobById(99999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getJobs', () => {
    it('should return jobs with pagination', async () => {
      // Arrange
      await TestUtils.createMultipleTestJobs(prisma, 5);

      // Act
      const result = await jobRepository.getJobs({}, { skip: 0, take: 3 });

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no jobs exist', async () => {
      // Act
      const result = await jobRepository.getJobs({}, { skip: 0, take: 10 });

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('updateJob', () => {
    it('should update job successfully', async () => {
      // Arrange
      const jobData = TestUtils.generateMockJobData();
      const createdJob = await jobRepository.createJob(jobData);
      const updateData = { title: 'Updated Title', status: JobStatus.APPLIED };

      // Act
      const result = await jobRepository.updateJob(createdJob.id, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe(JobStatus.APPLIED);
      expect(result.company).toBe(jobData.company); // Should remain unchanged
    });

    it('should throw error when updating non-existent job', async () => {
      // Act & Assert
      await expect(
        jobRepository.updateJob(99999, { title: 'Updated' }),
      ).rejects.toThrow();
    });
  });

  describe('deleteJob', () => {
    it('should delete job successfully', async () => {
      // Arrange
      const jobData = TestUtils.generateMockJobData();
      const createdJob = await jobRepository.createJob(jobData);

      // Act
      await jobRepository.deleteJob(createdJob.id);

      // Assert
      const deletedJob = await jobRepository.getJobById(createdJob.id);
      expect(deletedJob).toBeNull();
    });

    it('should throw error when deleting non-existent job', async () => {
      // Act & Assert
      await expect(jobRepository.deleteJob(99999)).rejects.toThrow();
    });
  });

  describe('getJobs with search', () => {
    it('should search jobs by title', async () => {
      // Arrange
      await TestUtils.createTestJob(prisma, {
        title: 'Frontend Developer',
        company: 'Tech Corp',
        applyLink: 'https://example.com/frontend',
      });
      await TestUtils.createTestJob(prisma, {
        title: 'Backend Developer',
        company: 'Tech Corp',
        applyLink: 'https://example.com/backend',
      });

      // Act
      const result = await jobRepository.getJobs({ searchText: 'Frontend' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Frontend Developer');
    });

    it('should search jobs by company', async () => {
      // Arrange
      await TestUtils.createTestJob(prisma, {
        title: 'Developer',
        company: 'Google',
        applyLink: 'https://example.com/google',
      });
      await TestUtils.createTestJob(prisma, {
        title: 'Developer',
        company: 'Microsoft',
        applyLink: 'https://example.com/microsoft',
      });

      // Act
      const result = await jobRepository.getJobs({ searchText: 'Google' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Google');
    });
  });
});
