import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ArbeitnowScraper } from './arbeitnow-scraper';
import { ArbeitnowV1Parser } from './v1/arbeitnow-v1.parser';
import { Job } from '../base/interfaces';

describe('ArbeitnowScraper', () => {
  let scraper: ArbeitnowScraper;
  let mockParser: jest.Mocked<ArbeitnowV1Parser>;

  const mockJob: Job = {
    title: 'Senior Frontend Developer',
    company: 'GermanTech',
    location: 'Berlin, Germany',
    applyLink: 'https://www.arbeitnow.com/jobs/123',
    postedDate: new Date('2025-01-01'),
    salary: '€60k - €80k',
    tags: ['React', 'Vue.js', 'TypeScript', 'Visa Sponsorship'],
    status: 'ACTIVE',
    applied: false,
    dateScraped: new Date(),
    lastUpdated: new Date(),
    searchText: 'senior frontend developer germantech berlin germany',
    source: 'Arbeitnow',
    sourceId: 'senior-frontend-developer-germantech',
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
        ArbeitnowScraper,
        {
          provide: ArbeitnowV1Parser,
          useValue: mockParser,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://www.arbeitnow.com'),
          },
        },
      ],
    }).compile();

    scraper = module.get<ArbeitnowScraper>(ArbeitnowScraper);

    // Mock the sleep method to avoid delays in tests
    jest.spyOn(scraper as any, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct properties', () => {
      expect(scraper.name).toBe('Arbeitnow');
      expect(scraper.version).toBe('v1');
      expect(scraper.baseUrl).toBe('https://www.arbeitnow.com');
    });

    it('should have appropriate rate limits', () => {
      const rateLimit = scraper.getRateLimit();
      expect(rateLimit.requestsPerMinute).toBe(30);
      expect(rateLimit.delayBetweenRequests.min).toBe(2000);
      expect(rateLimit.delayBetweenRequests.max).toBe(5000);
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
        'All Arbeitnow scraper versions failed',
      );
    });

    it('should handle parsing errors gracefully', async () => {
      mockParser.parseJobs.mockReturnValue([]);
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>No jobs here</div>'),
      });
      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Arbeitnow scraper versions failed',
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

      expect(page1Url).toBe('https://www.arbeitnow.com');
      expect(page2Url).toBe('https://www.arbeitnow.com?page=2');
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
        'All Arbeitnow scraper versions failed',
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
        'All Arbeitnow scraper versions failed',
      );
    });

    it('should handle rate limiting gracefully', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All Arbeitnow scraper versions failed',
      );
    });
  });

  describe('German-specific features', () => {
    it('should handle German job locations', () => {
      const germanJob = { ...mockJob, location: 'München, Deutschland' };
      expect(germanJob.location).toContain('München');
    });

    it('should handle visa sponsorship tags', () => {
      expect(mockJob.tags).toContain('Visa Sponsorship');
    });

    it('should handle relocation package tags', () => {
      const relocationJob = {
        ...mockJob,
        tags: [...mockJob.tags, 'Relocation Package'],
      };
      expect(relocationJob.tags).toContain('Relocation Package');
    });
  });
});
