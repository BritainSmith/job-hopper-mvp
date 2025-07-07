import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';
import { DataCleaningService } from '../services/data-cleaning.service';
import { JobDeduplicationService } from '../services/job-deduplication.service';

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
});
