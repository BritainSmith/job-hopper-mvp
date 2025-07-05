import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { JobRepository } from '../repositories/job.repository';
import { ScraperFactory } from '../scrapers/scraper-factory';
import { LoggingService } from '../common/services/logging.service';
import { Job, JobStatus } from '@prisma/client';

describe('JobService', () => {
  let service: JobService;
  let repository: JobRepository;
  let scraperFactory: ScraperFactory;
  let loggingService: LoggingService;

  const mockJob: Job = {
    id: 1,
    title: 'Test',
    company: 'TestCo',
    location: 'Remote',
    applyLink: 'link',
    status: 'ACTIVE',
    applied: false,
    appliedAt: null,
    dateScraped: new Date('2023-01-01'),
    lastUpdated: new Date('2023-01-01'),
    searchText: 'test',
    source: 'remoteok',
    tags: 'typescript,react',
    salary: '100k-150k',
    postedDate: '2d ago',
    companyId: null,
  };

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
    logScrapingOperation: jest.fn(),
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
    loggingService = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    it('should call repository.createJob and return job', async () => {
      mockJobRepository.createJob.mockResolvedValue(mockJob);
      const jobData = { ...mockJob };
      const result = await service.createJob(jobData as any);
      expect(repository.createJob).toHaveBeenCalled();
      expect(result).toEqual(mockJob);
    });
    it('should handle errors', async () => {
      mockJobRepository.createJob.mockRejectedValue(new Error('fail'));
      await expect(service.createJob({} as any)).rejects.toThrow(
        'Failed to create job',
      );
    });
  });

  describe('getJobById', () => {
    it('should call repository.getJobById and return job', async () => {
      mockJobRepository.getJobById.mockResolvedValue(mockJob);
      const result = await service.getJobById(1);
      expect(repository.getJobById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockJob);
    });
    it('should handle errors', async () => {
      mockJobRepository.getJobById.mockRejectedValue(new Error('fail'));
      await expect(service.getJobById(1)).rejects.toThrow(
        'Failed to fetch job',
      );
    });
  });

  describe('updateJob', () => {
    it('should call repository.updateJob and return job', async () => {
      mockJobRepository.getJobById.mockResolvedValue(mockJob);
      mockJobRepository.updateJob.mockResolvedValue(mockJob);
      const result = await service.updateJob(1, { title: 'Updated' });
      expect(repository.updateJob).toHaveBeenCalled();
      expect(result).toEqual(mockJob);
    });
    it('should handle errors', async () => {
      mockJobRepository.updateJob.mockRejectedValue(new Error('fail'));
      await expect(service.updateJob(1, {})).rejects.toThrow(
        'Failed to update job',
      );
    });
  });

  describe('deleteJob', () => {
    it('should call repository.deleteJob and return job', async () => {
      mockJobRepository.deleteJob.mockResolvedValue(mockJob);
      const result = await service.deleteJob(1);
      expect(repository.deleteJob).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockJob);
    });
    it('should handle errors', async () => {
      mockJobRepository.deleteJob.mockRejectedValue(new Error('fail'));
      await expect(service.deleteJob(1)).rejects.toThrow(
        'Failed to delete job',
      );
    });
  });

  describe('searchJobs', () => {
    it('should call repository.getJobs and return jobs', async () => {
      mockJobRepository.getJobs.mockResolvedValue([mockJob]);
      const result = await service.searchJobs({ query: 'test' });
      expect(repository.getJobs).toHaveBeenCalled();
      expect(result).toEqual([mockJob]);
    });
    it('should handle errors', async () => {
      mockJobRepository.getJobs.mockRejectedValue(new Error('fail'));
      await expect(service.searchJobs({})).rejects.toThrow(
        'Failed to search jobs',
      );
    });
  });

  describe('getJobsByStatus', () => {
    it('should call searchJobs with status filter', async () => {
      jest.spyOn(service, 'searchJobs').mockResolvedValue([mockJob]);
      const result = await service.getJobsByStatus('ACTIVE');
      expect(service.searchJobs).toHaveBeenCalledWith({
        filters: { status: 'ACTIVE' },
        pagination: undefined,
      });
      expect(result).toEqual([mockJob]);
    });
  });

  describe('getAppliedJobs', () => {
    it('should call searchJobs with applied filter', async () => {
      jest.spyOn(service, 'searchJobs').mockResolvedValue([mockJob]);
      const result = await service.getAppliedJobs();
      expect(service.searchJobs).toHaveBeenCalledWith({
        filters: { applied: true },
        pagination: undefined,
      });
      expect(result).toEqual([mockJob]);
    });
  });

  describe('getActiveJobs', () => {
    it('should call searchJobs with status ACTIVE', async () => {
      jest.spyOn(service, 'searchJobs').mockResolvedValue([mockJob]);
      const result = await service.getActiveJobs();
      expect(service.searchJobs).toHaveBeenCalledWith({
        filters: { status: 'ACTIVE' },
        pagination: undefined,
      });
      expect(result).toEqual([mockJob]);
    });
  });

  describe('applyToJob', () => {
    it('should call updateJob and return job', async () => {
      jest.spyOn(service, 'updateJob').mockResolvedValue(mockJob);
      const result = await service.applyToJob(1, { status: 'APPLIED' });
      expect(service.updateJob).toHaveBeenCalled();
      expect(result).toEqual(mockJob);
    });
    it('should handle errors', async () => {
      jest.spyOn(service, 'updateJob').mockRejectedValue(new Error('fail'));
      await expect(
        service.applyToJob(1, { status: 'APPLIED' }),
      ).rejects.toThrow('Failed to apply to job');
    });
  });

  describe('updateApplicationStatus', () => {
    it('should call updateJob and return job', async () => {
      jest.spyOn(service, 'updateJob').mockResolvedValue(mockJob);
      const result = await service.updateApplicationStatus(1, 'APPLIED');
      expect(service.updateJob).toHaveBeenCalled();
      expect(result).toEqual(mockJob);
    });
    it('should handle errors', async () => {
      jest.spyOn(service, 'updateJob').mockRejectedValue(new Error('fail'));
      await expect(
        service.updateApplicationStatus(1, 'APPLIED'),
      ).rejects.toThrow('Failed to update application status');
    });
  });

  describe('scrapeAndSaveJobs', () => {
    it('should scrape and save jobs from a specific source', async () => {
      mockScraperFactory.scrapeSpecific.mockResolvedValue([mockJob]);
      mockJobRepository.upsertJob.mockResolvedValue(mockJob);
      const result = await service.scrapeAndSaveJobs('remoteok');
      expect(scraperFactory.scrapeSpecific).toHaveBeenCalledWith(
        ['remoteok'],
        undefined,
      );
      expect(repository.upsertJob).toHaveBeenCalled();
      expect(result).toEqual({ scraped: 1, saved: 1 });
    });
    it('should scrape and save jobs from all sources', async () => {
      mockScraperFactory.scrapeAll.mockResolvedValue([mockJob]);
      mockJobRepository.upsertJob.mockResolvedValue(mockJob);
      const result = await service.scrapeAndSaveJobs('all');
      expect(scraperFactory.scrapeAll).toHaveBeenCalledWith(undefined);
      expect(repository.upsertJob).toHaveBeenCalled();
      expect(result).toEqual({ scraped: 1, saved: 1 });
    });
    it('should handle errors during scraping', async () => {
      mockScraperFactory.scrapeSpecific.mockRejectedValue(new Error('fail'));
      await expect(service.scrapeAndSaveJobs('remoteok')).rejects.toThrow(
        'Failed to scrape and save jobs',
      );
    });
  });

  describe('getJobStats', () => {
    it('should return job statistics', async () => {
      mockJobRepository.getJobStats.mockResolvedValue({
        total: 1,
        applied: 1,
        notApplied: 0,
        byStatus: { ACTIVE: 1 },
      });
      mockJobRepository.getJobs.mockResolvedValue([mockJob]);
      const result = await service.getJobStats();
      expect(result).toEqual({
        total: 1,
        applied: 1,
        active: 0,
        byStatus: { ACTIVE: 1 },
        byCompany: { TestCo: 1 },
        byLocation: { Remote: 1 },
      });
    });
    it('should handle errors', async () => {
      mockJobRepository.getJobStats.mockRejectedValue(new Error('fail'));
      await expect(service.getJobStats()).rejects.toThrow(
        'Failed to get job statistics',
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update status for multiple jobs', async () => {
      jest.spyOn(service, 'updateApplicationStatus').mockResolvedValue(mockJob);
      const result = await service.bulkUpdateStatus([1, 2, 3], 'APPLIED');
      expect(service.updateApplicationStatus).toHaveBeenCalledTimes(3);
      expect(result).toBe(3);
    });
    it('should handle errors and continue updating', async () => {
      jest
        .spyOn(service, 'updateApplicationStatus')
        .mockResolvedValueOnce(mockJob)
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(mockJob);
      const result = await service.bulkUpdateStatus([1, 2, 3], 'APPLIED');
      expect(service.updateApplicationStatus).toHaveBeenCalledTimes(3);
      expect(result).toBe(2);
    });
    it('should handle bulk update errors', async () => {
      jest
        .spyOn(service, 'updateApplicationStatus')
        .mockRejectedValue(new Error('fail'));
      const result = await service.bulkUpdateStatus([1, 2, 3], 'APPLIED');
      expect(result).toBe(0);
    });
  });

  describe('findDuplicateJobs', () => {
    it('should call repository.getJobs and return jobs', async () => {
      mockJobRepository.getJobs.mockResolvedValue([mockJob]);
      const result = await service.findDuplicateJobs(mockJob as any);
      expect(repository.getJobs).toHaveBeenCalled();
      expect(result).toEqual([mockJob]);
    });
    it('should handle errors', async () => {
      mockJobRepository.getJobs.mockRejectedValue(new Error('fail'));
      await expect(service.findDuplicateJobs(mockJob as any)).rejects.toThrow(
        'Failed to find duplicate jobs',
      );
    });
  });
});
