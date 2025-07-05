import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JobsController } from './jobs.controller';
import { JobService } from '../services/job.service';

describe('JobsController', () => {
  let app: INestApplication;
  const mockJobService = {
    getJobsByStatus: jest.fn().mockResolvedValue([]),
    searchJobs: jest.fn().mockResolvedValue([]),
    getJobStats: jest
      .fn()
      .mockResolvedValue({
        total: 0,
        applied: 0,
        active: 0,
        byStatus: {},
        byCompany: {},
        byLocation: {},
      }),
    scrapeAndSaveJobs: jest.fn().mockResolvedValue({ scraped: 0, saved: 0 }),
    getJobById: jest.fn().mockResolvedValue(null),
    createJob: jest.fn().mockResolvedValue({ id: 1 }),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobService, useValue: mockJobService }],
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
    return request(app.getHttpServer())
      .get('/jobs/stats')
      .expect(200)
      .expect({
        total: 0,
        applied: 0,
        active: 0,
        byStatus: {},
        byCompany: {},
        byLocation: {},
      });
  });
});
