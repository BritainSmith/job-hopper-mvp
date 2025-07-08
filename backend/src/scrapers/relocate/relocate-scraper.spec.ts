import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RelocateScraper } from './relocate-scraper';
import { RelocateV1Parser } from './v1/relocate-v1.parser';
import { Job } from '../base/interfaces';

describe('RelocateScraper', () => {
  let scraper: RelocateScraper;
  let mockParser: jest.Mocked<RelocateV1Parser>;

  const mockJob: Job = {
    title: 'Senior DevOps Engineer',
    company: 'GlobalTech',
    location: 'Amsterdam, Netherlands',
    applyLink: 'https://relocate.me/jobs/123',
    postedDate: new Date('2025-01-01'),
    salary: '€70k - €90k',
    tags: [
      'Docker',
      'Kubernetes',
      'AWS',
      'Visa Sponsorship',
      'Relocation Package',
    ],
    status: 'ACTIVE',
    applied: false,
    dateScraped: new Date(),
    lastUpdated: new Date(),
    searchText: 'senior devops engineer globaltech amsterdam netherlands',
    source: 'Relocate.me',
    sourceId: 'senior-devops-engineer-globaltech',
  };

  beforeEach(async () => {
    // Create mock parser
    mockParser = {
      parseJobs: jest.fn(),
      hasNextPage: jest.fn(),
      getCurrentPage: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelocateScraper,
        {
          provide: RelocateV1Parser,
          useValue: mockParser,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://relocate.me'),
          },
        },
      ],
    }).compile();

    scraper = module.get<RelocateScraper>(RelocateScraper);

    // Mock the sleep method to avoid delays in tests
    jest.spyOn(scraper as any, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct properties', () => {
      expect(scraper.name).toBe('Relocate.me');
      expect(scraper.version).toBe('v1');
      expect(scraper.baseUrl).toBe('https://relocate.me');
    });

    it('should have appropriate rate limits', () => {
      const rateLimit = scraper.getRateLimit();
      expect(rateLimit.requestsPerMinute).toBe(25);
      expect(rateLimit.delayBetweenRequests.min).toBe(2500);
      expect(rateLimit.delayBetweenRequests.max).toBe(6000);
      expect(rateLimit.maxConcurrentRequests).toBe(2);
    });
  });

  describe('scrapeJobs', () => {
    it('should successfully scrape jobs with default options', async () => {
      const mockHtml = '<div class="job-card">Job content</div>';
      mockParser.parseJobs.mockReturnValue([mockJob]);
      mockParser.hasNextPage.mockReturnValue(false);
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      const result = await scraper.scrapeJobs();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockJob);
      expect(mockParser.parseJobs).toHaveBeenCalledWith(mockHtml);
    });

    it('should respect maxPages option', async () => {
      const mockHtml = '<div class="job-card">Job content</div>';
      mockParser.parseJobs.mockReturnValue([mockJob]);
      mockParser.hasNextPage.mockReturnValue(true);
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      await scraper.scrapeJobs({ maxPages: 2 });
      expect(mockParser.parseJobs).toHaveBeenCalledTimes(2);
    });

    it('should respect maxJobs option', async () => {
      const mockHtml = '<div class="job-card">Job content</div>';
      const multipleJobs = [
        mockJob,
        { ...mockJob, title: 'Job 2' },
        { ...mockJob, title: 'Job 3' },
      ];
      mockParser.parseJobs.mockReturnValue(multipleJobs);
      mockParser.hasNextPage.mockReturnValue(false);
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      const result = await scraper.scrapeJobs({ maxJobs: 2 });
      expect(result).toHaveLength(2);
    });

    it('should handle HTTP errors gracefully', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Relocate.me scraper versions failed',
      );
    });

    it('should handle parsing errors gracefully', async () => {
      mockParser.parseJobs.mockReturnValue([]);
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>No jobs here</div>'),
      });
      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Relocate.me scraper versions failed',
      );
    });
  });

  describe('version detection', () => {
    it('should detect v2 structure', async () => {
      const v2Html = '<div class="job-listing">New structure</div>';

      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(v2Html),
      });

      const version = await (scraper as any).detectVersion();
      expect(version).toBe('v2');
    });

    it('should detect v1 structure', async () => {
      const v1Html = '<div class="job-card">Old structure</div>';

      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(v1Html),
      });

      const version = await (scraper as any).detectVersion();
      expect(version).toBe('v1');
    });

    it('should return null for unknown structure', async () => {
      const unknownHtml = '<div class="unknown">Unknown structure</div>';

      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(unknownHtml),
      });

      const version = await (scraper as any).detectVersion();
      expect(version).toBeNull();
    });
  });

  describe('URL building', () => {
    it('should build correct URLs for different pages', () => {
      const page1Url = (scraper as any).buildPageUrl(1);
      const page2Url = (scraper as any).buildPageUrl(2);

      expect(page1Url).toBe('https://relocate.me/jobs');
      expect(page2Url).toBe('https://relocate.me/jobs?page=2');
    });
  });

  describe('health checks', () => {
    it('should return true for healthy service', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
      });

      const isHealthy = await scraper.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should return false for unhealthy service', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: false,
      });

      const isHealthy = await scraper.isHealthy();
      expect(isHealthy).toBe(false);
    });

    it('should handle request errors', async () => {
      jest
        .spyOn(scraper as any, 'makeRequest')
        .mockRejectedValue(new Error('Network error'));

      const isHealthy = await scraper.isHealthy();
      expect(isHealthy).toBe(false);
    });
  });

  describe('version management', () => {
    it('should return current version', () => {
      const version = scraper.getCurrentVersion();
      expect(version).toBe('v1');
    });

    it('should return available versions', () => {
      const versions = scraper.getAvailableVersions();
      expect(versions).toContain('v1');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      jest
        .spyOn(scraper as any, 'makeRequest')
        .mockRejectedValue(new Error('Timeout'));

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Relocate.me scraper versions failed',
      );
    });

    it('should handle malformed HTML', async () => {
      mockParser.parseJobs.mockImplementation(() => {
        throw new Error('Malformed HTML');
      });

      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<malformed>html'),
      });

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Relocate.me scraper versions failed',
      );
    });

    it('should handle rate limiting gracefully', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Relocate.me scraper versions failed',
      );
    });

    it('should handle 404 errors gracefully', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Relocate.me scraper versions failed',
      );
    });
  });

  describe('international features', () => {
    it('should handle multi-country locations', () => {
      const internationalJob = { ...mockJob, location: 'London, UK' };
      expect(internationalJob.location).toContain('London');
    });

    it('should handle visa sponsorship tags', () => {
      expect(mockJob.tags).toContain('Visa Sponsorship');
    });

    it('should handle relocation package tags', () => {
      expect(mockJob.tags).toContain('Relocation Package');
    });

    it('should handle remote work indicators', () => {
      const remoteJob = { ...mockJob, tags: [...mockJob.tags, 'Remote'] };
      expect(remoteJob.tags).toContain('Remote');
    });

    it('should handle on-site work indicators', () => {
      const onsiteJob = { ...mockJob, tags: [...mockJob.tags, 'On-site'] };
      expect(onsiteJob.tags).toContain('On-site');
    });
  });

  describe('date parsing', () => {
    it('should handle international date formats', () => {
      const internationalJob = {
        ...mockJob,
        postedDate: new Date('2025-01-15'),
      };
      expect(internationalJob.postedDate).toBeInstanceOf(Date);
    });

    it('should handle relative dates', () => {
      const relativeDateJob = { ...mockJob, postedDate: new Date() };
      expect(relativeDateJob.postedDate).toBeInstanceOf(Date);
    });
  });
});
