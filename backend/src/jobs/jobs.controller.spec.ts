import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';
import { DataCleaningService } from '../services/data-cleaning.service';
import { JobDeduplicationService } from '../services/job-deduplication.service';
import { AIService } from '../services/ai.service';
import { AIJobFilterService } from '../services/ai-job-filter.service';

describe('JobsController', () => {
  let app: INestApplication;
  const mockJobService = {
    getJobsByStatus: jest.fn().mockResolvedValue([]),
    searchJobs: jest.fn().mockResolvedValue([]),
    getJobStats: jest.fn().mockResolvedValue({
      total: 0,
      applied: 0,
      active: 0,
      byStatus: {},
      byCompany: {},
      byLocation: {},
    }),
    scrapeAndSaveJobs: jest.fn().mockResolvedValue({ scraped: 0, saved: 0 }),
    getJobById: jest.fn().mockResolvedValue({ id: 1, title: 'Test Job' }),
    createJob: jest.fn().mockResolvedValue({ id: 1 }),
    getAllJobs: jest.fn().mockResolvedValue([]),
  };

  const mockDataCleaningService = {
    cleanJobData: jest.fn().mockResolvedValue({}),
    getDataQualityMetrics: jest.fn().mockResolvedValue({
      totalJobs: 0,
      jobsWithCompleteData: 0,
      jobsWithSalary: 0,
      jobsWithSkills: 0,
      averageQualityScore: 0,
      commonIssues: [],
    }),
    exportCleanedData: jest.fn().mockResolvedValue([]),
  };

  const mockJobDeduplicationService = {
    findDuplicates: jest.fn().mockResolvedValue([]),
    analyzeDeduplication: jest.fn().mockResolvedValue([]),
    getDeduplicationStats: jest.fn().mockResolvedValue({}),
    checkForDuplicates: jest.fn().mockResolvedValue({}),
    processJobsWithDeduplication: jest.fn().mockResolvedValue({}),
  };

  const mockAIService = {
    analyzeJob: jest.fn().mockResolvedValue({
      classification: {
        seniorityLevel: 'senior',
        requiredSkills: ['JavaScript'],
        remoteType: 'remote',
        jobType: 'full-time',
        confidence: 0.8,
        reasoning: 'Test analysis',
      },
      processingTime: 100,
      costEstimate: 0.001,
    }),
    isAvailable: jest.fn().mockReturnValue(true),
    getStatus: jest.fn().mockReturnValue({
      available: true,
      model: 'gpt-4o-mini',
      configured: true,
    }),
  };

  const mockAIJobFilterService = {
    filterJobsWithAI: jest.fn().mockResolvedValue({
      jobs: [],
      totalJobs: 0,
      jobsAnalyzed: 0,
      processingTime: 100,
      totalCost: 0.001,
      filterSummary: {
        appliedFilters: [],
        confidenceDistribution: {},
        seniorityDistribution: {},
        remoteTypeDistribution: {},
      },
    }),
    getJobRecommendations: jest.fn().mockResolvedValue({
      recommendations: [],
      processingTime: 100,
      totalCost: 0.001,
      summary: {
        totalJobsAnalyzed: 0,
        averageMatchScore: 0,
        topMatchReasons: [],
      },
    }),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        { provide: JobService, useValue: mockJobService },
        { provide: DataCleaningService, useValue: mockDataCleaningService },
        {
          provide: JobDeduplicationService,
          useValue: mockJobDeduplicationService,
        },
        { provide: AIService, useValue: mockAIService },
        { provide: AIJobFilterService, useValue: mockAIJobFilterService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/jobs (GET) should return jobs', () => {
    return request(app.getHttpServer()).get('/jobs').expect(200).expect([]);
  });

  it('/jobs/stats (GET) should return job stats', () => {
    return request(app.getHttpServer()).get('/jobs/stats').expect(200).expect({
      total: 0,
      applied: 0,
      active: 0,
      byStatus: {},
      byCompany: {},
      byLocation: {},
    });
  });

  describe('Deduplication endpoints', () => {
    it('/jobs/deduplicate/stats (GET) should return deduplication statistics', () => {
      return request(app.getHttpServer())
        .get('/jobs/deduplicate/stats')
        .expect(200)
        .expect({});
    });

    it('/jobs/deduplicate/check (POST) should check job for duplicates', () => {
      const jobData = {
        title: 'Test Job',
        company: 'Test Company',
        location: 'Remote',
        applyLink: 'https://example.com',
      };

      return request(app.getHttpServer())
        .post('/jobs/deduplicate/check')
        .send(jobData)
        .expect(201)
        .expect({});
    });
  });

  describe('Data cleaning endpoints', () => {
    it('/jobs/data-quality/metrics (GET) should return data quality metrics', () => {
      return request(app.getHttpServer())
        .get('/jobs/data-quality/metrics')
        .expect(200)
        .expect({
          totalJobs: 0,
          jobsWithCompleteData: 0,
          jobsWithSalary: 0,
          jobsWithSkills: 0,
          averageQualityScore: 0,
          commonIssues: [],
        });
    });

    it('/jobs/data-quality/export (GET) should return cleaned job data', () => {
      return request(app.getHttpServer())
        .get('/jobs/data-quality/export')
        .expect(200)
        .expect([]);
    });

    it('/jobs/data-quality/clean/:id (GET) should clean specific job data', () => {
      return request(app.getHttpServer())
        .get('/jobs/data-quality/clean/1')
        .expect(200)
        .expect({});
    });
  });

  describe('AI Analysis endpoints', () => {
    it('/jobs/ai/status (GET) should return AI service status', () => {
      return request(app.getHttpServer())
        .get('/jobs/ai/status')
        .expect(200)
        .expect({
          available: true,
          model: 'gpt-4o-mini',
          configured: true,
        });
    });

    it('/jobs/ai/analyze (POST) should analyze job with AI', () => {
      const jobData = {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior engineer...',
        salary: '$120k - $180k',
        tags: 'JavaScript, React, Node.js',
      };

      return request(app.getHttpServer())
        .post('/jobs/ai/analyze')
        .send(jobData)
        .expect(201)
        .expect({
          classification: {
            seniorityLevel: 'senior',
            requiredSkills: ['JavaScript'],
            remoteType: 'remote',
            jobType: 'full-time',
            confidence: 0.8,
            reasoning: 'Test analysis',
          },
          processingTime: 100,
          costEstimate: 0.001,
        });
    });

    it('/jobs/ai/analyze/batch (POST) should analyze multiple jobs', () => {
      const batchData = {
        jobs: [
          {
            jobTitle: 'Frontend Developer',
            company: 'Startup',
            location: 'Remote',
          },
          {
            jobTitle: 'Backend Developer',
            company: 'Enterprise',
            location: 'New York',
          },
        ],
        enableCaching: true,
      };

      return request(app.getHttpServer())
        .post('/jobs/ai/analyze/batch')
        .send(batchData)
        .expect(201)
        .expect((res) => {
          expect(res.body.results).toHaveLength(2);
          expect(res.body.totalProcessingTime).toBeGreaterThanOrEqual(0);
          expect(res.body.totalCostEstimate).toBeGreaterThan(0);
          expect(res.body.jobsProcessed).toBe(2);
          expect(res.body.jobsCached).toBe(0);
          expect(res.body.results[0]).toHaveProperty('classification');
          expect(res.body.results[0]).toHaveProperty('processingTime');
          expect(res.body.results[0]).toHaveProperty('costEstimate');
        });
    });

    it('/jobs/:id/ai-analysis (GET) should analyze existing job', () => {
      return request(app.getHttpServer())
        .get('/jobs/1/ai-analysis')
        .expect(200)
        .expect({
          classification: {
            seniorityLevel: 'senior',
            requiredSkills: ['JavaScript'],
            remoteType: 'remote',
            jobType: 'full-time',
            confidence: 0.8,
            reasoning: 'Test analysis',
          },
          processingTime: 100,
          costEstimate: 0.001,
        });
    });
  });
});
