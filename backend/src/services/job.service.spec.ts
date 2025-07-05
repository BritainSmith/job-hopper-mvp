import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { JobRepository } from '../repositories/job.repository';
import { RemoteOKService } from '../scrapers/remoteok.service';

describe('JobService', () => {
  let service: JobService;
  let repository: JobRepository;
  let remoteOK: RemoteOKService;

  const mockJobRepository = {
    createJob: jest.fn(),
    getJobById: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    getJobs: jest.fn(),
    upsertJob: jest.fn(),
    getJobStats: jest.fn(),
  };

  const mockRemoteOKService = {
    scrapeJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: JobRepository, useValue: mockJobRepository },
        { provide: RemoteOKService, useValue: mockRemoteOKService },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    repository = module.get<JobRepository>(JobRepository);
    remoteOK = module.get<RemoteOKService>(RemoteOKService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call repository.createJob on createJob', async () => {
    const jobData = { title: 'Test', company: 'TestCo', location: 'Remote', applyLink: 'link', status: 'ACTIVE', applied: false, dateScraped: new Date(), lastUpdated: new Date(), searchText: 'test', source: 'remoteok' };
    await service.createJob(jobData as any);
    expect(repository.createJob).toHaveBeenCalled();
  });
}); 