import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { JobRepository } from '../repositories/job.repository';
import { ScraperFactory } from '../scrapers/scraper-factory';
import { LoggingService } from '../common/services/logging.service';

describe('JobService', () => {
  let service: JobService;
  let repository: JobRepository;
  let scraperFactory: ScraperFactory;

  const mockJobRepository = {
    createJob: jest.fn(),
    getJobById: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    getJobs: jest.fn(),
    upsertJob: jest.fn(),
    getJobStats: jest.fn(),
  };

  const mockScraperFactory = {
    scrapeAll: jest.fn(),
    scrapeSpecific: jest.fn(),
    getScraper: jest.fn(),
    getAllScrapers: jest.fn(),
    getEnabledScrapers: jest.fn(),
    getScraperMetrics: jest.fn(),
    getScraperHealth: jest.fn(),
    checkAllScrapersHealth: jest.fn(),
    getScraperConfig: jest.fn(),
    updateScraperConfig: jest.fn(),
    getAvailableScrapers: jest.fn(),
    getScraperInfo: jest.fn(),
  };

  const mockLoggingService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: JobRepository, useValue: mockJobRepository },
        { provide: ScraperFactory, useValue: mockScraperFactory },
        { provide: LoggingService, useValue: mockLoggingService },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    repository = module.get<JobRepository>(JobRepository);
    scraperFactory = module.get<ScraperFactory>(ScraperFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call repository.createJob on createJob', async () => {
    const jobData = {
      title: 'Test',
      company: 'TestCo',
      location: 'Remote',
      applyLink: 'link',
      status: 'ACTIVE',
      applied: false,
      dateScraped: new Date(),
      lastUpdated: new Date(),
      searchText: 'test',
      source: 'remoteok',
    };
    await service.createJob(jobData as any);
    expect(repository.createJob).toHaveBeenCalled();
  });
});
