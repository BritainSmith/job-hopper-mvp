import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RemoteOKScraper } from './remoteok-scraper';
import { RemoteOKV1Parser } from './v1/remoteok-v1.parser';
import { Job, ScrapingOptions } from '../base/interfaces';

// Mock the base scraper's makeRequest method
jest.mock('../base/base-scraper.abstract', () => {
  const originalModule = jest.requireActual('../base/base-scraper.abstract');
  return {
    ...originalModule,
    BaseScraper: class MockBaseScraper {
      protected logger = new Logger('MockBaseScraper');
      protected metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastScraped: new Date(),
        version: 'unknown',
      };

      protected async makeRequest(url: string): Promise<Response> {
        // Mock implementation
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => Promise.resolve('<html><body>Mock HTML</body></html>'),
        } as Response);
      }

      protected async sleep(ms: number): Promise<void> {
        return Promise.resolve();
      }

      getMetrics() {
        return { ...this.metrics };
      }
    },
  };
});

describe('RemoteOKScraper', () => {
  let scraper: RemoteOKScraper;
  let mockParser: any;

  const mockJobs: Job[] = [
    {
      id: '1',
      title: 'Senior Developer',
      company: 'Tech Corp',
      location: 'Remote',
      applyLink: 'https://example.com/apply',
      postedDate: new Date('2023-01-01'),
      salary: '$100k-150k',
      tags: ['JavaScript', 'React'],
      status: 'ACTIVE',
      applied: false,
      dateScraped: new Date(),
      lastUpdated: new Date(),
      searchText: 'senior developer tech corp remote',
      source: 'RemoteOK',
      sourceId: 'remoteok-1',
    },
    {
      id: '2',
      title: 'Frontend Engineer',
      company: 'Startup Inc',
      location: 'Remote',
      applyLink: 'https://example.com/apply2',
      postedDate: new Date('2023-01-02'),
      salary: '$80k-120k',
      tags: ['TypeScript', 'Vue'],
      status: 'ACTIVE',
      applied: false,
      dateScraped: new Date(),
      lastUpdated: new Date(),
      searchText: 'frontend engineer startup inc remote',
      source: 'RemoteOK',
      sourceId: 'remoteok-2',
    },
  ];

  beforeEach(async () => {
    // Create mock parser with simple typing
    mockParser = {
      parseJobs: jest.fn().mockReturnValue([]),
      parseJobCard: jest.fn().mockReturnValue(null),
      hasNextPage: jest.fn().mockReturnValue(false),
      getCurrentPage: jest.fn().mockReturnValue(1),
    };

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoteOKScraper],
    }).compile();

    scraper = module.get<RemoteOKScraper>(RemoteOKScraper);

    // Mock the private versions map to use our mock parser
    (scraper as any).versions = new Map([['v1', mockParser]]);
    (scraper as any).currentVersion = 'v1';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should initialize with correct properties', () => {
      expect(scraper.name).toBe('RemoteOK');
      expect(scraper.version).toBe('v1');
      expect(scraper.baseUrl).toBe('https://remoteok.com');
    });

    it('should set up rate limit configuration', () => {
      const rateLimit = scraper.getRateLimit();
      expect(rateLimit.requestsPerMinute).toBe(30);
      expect(rateLimit.delayBetweenRequests.min).toBe(2000);
      expect(rateLimit.delayBetweenRequests.max).toBe(5000);
      expect(rateLimit.maxConcurrentRequests).toBe(1);
    });

    it('should initialize with v1 parser', () => {
      const versions = (scraper as any).getAvailableVersions();
      expect(versions).toContain('v1');
    });
  });

  describe('scrapeJobs', () => {
    it('should scrape jobs successfully with default options', async () => {
      mockParser.parseJobs.mockReturnValue(mockJobs);
      mockParser.hasNextPage.mockReturnValue(false);

      const jobs = await scraper.scrapeJobs();

      expect(jobs).toHaveLength(2);
      expect(jobs[0].title).toBe('Senior Developer');
      expect(jobs[1].title).toBe('Frontend Engineer');
      expect(mockParser.parseJobs).toHaveBeenCalledTimes(1);
    });

    it('should respect maxJobs option', async () => {
      mockParser.parseJobs.mockReturnValue(mockJobs);
      mockParser.hasNextPage.mockReturnValue(false);

      const jobs = await scraper.scrapeJobs({ maxJobs: 1 });

      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Senior Developer');
    });

    it('should handle multiple pages', async () => {
      mockParser.parseJobs
        .mockReturnValueOnce([mockJobs[0]])
        .mockReturnValueOnce([mockJobs[1]]);
      mockParser.hasNextPage
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const jobs = await scraper.scrapeJobs({ maxPages: 2 });

      expect(jobs).toHaveLength(2);
      expect(mockParser.parseJobs).toHaveBeenCalledTimes(2);
      expect(mockParser.hasNextPage).toHaveBeenCalledTimes(2);
    });

    it('should stop when no jobs are found on a page', async () => {
      mockParser.parseJobs.mockReturnValue([]);

      await expect(scraper.scrapeJobs()).rejects.toThrow('All RemoteOK scraper versions failed');
      expect(mockParser.parseJobs).toHaveBeenCalledTimes(1);
    });

    it('should handle parser not found error', async () => {
      (scraper as any).versions = new Map(); // Remove all parsers

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All RemoteOK scraper versions failed',
      );
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock makeRequest to throw an error
      jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(
        new Error('HTTP 500: Internal Server Error'),
      );

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All RemoteOK scraper versions failed',
      );
    });
  });

  describe('version detection and fallback', () => {
    it('should detect v2 version when HTML structure changes', async () => {
      // Mock makeRequest to return v2 HTML
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><div class="job-listing">v2 content</div></html>'),
      } as any);

      // Mock scrapeWithVersion to succeed with v2
      jest.spyOn(scraper as any, 'scrapeWithVersion')
        .mockRejectedValueOnce(new Error('v1 failed'))
        .mockResolvedValueOnce(mockJobs);

      const jobs = await scraper.scrapeJobs();

      expect(jobs).toHaveLength(2);
      expect((scraper as any).currentVersion).toBe('v2');
    });

    it('should fallback to other versions when current version fails', async () => {
      // Add a v2 parser to the versions map
      const mockV2Parser = {
        parseJobs: jest.fn().mockReturnValue(mockJobs),
        hasNextPage: jest.fn().mockReturnValue(false),
      };
      (scraper as any).versions.set('v2', mockV2Parser);

      // Mock makeRequest to return v1 HTML
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><div class="job">v1 content</div></html>'),
      } as any);

      // Mock scrapeWithVersion to fail with v1 but succeed with v2
      jest.spyOn(scraper as any, 'scrapeWithVersion')
        .mockRejectedValueOnce(new Error('v1 failed'))
        .mockResolvedValueOnce(mockJobs);

      const jobs = await scraper.scrapeJobs();

      expect(jobs).toHaveLength(2);
    });

    it('should throw error when all versions fail', async () => {
      // Mock makeRequest to return v1 HTML
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><div class="job">v1 content</div></html>'),
      } as any);

      // Mock scrapeWithVersion to fail
      jest.spyOn(scraper as any, 'scrapeWithVersion').mockRejectedValue(
        new Error('All versions failed'),
      );

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All RemoteOK scraper versions failed',
      );
    });
  });

  describe('private methods', () => {
    describe('scrapeWithVersion', () => {
      it('should scrape multiple pages until maxJobs is reached', async () => {
        mockParser.parseJobs.mockReturnValue([mockJobs[0]]);
        mockParser.hasNextPage.mockReturnValue(true);

        const jobs = await (scraper as any).scrapeWithVersion('v1', 3, 2);

        expect(jobs).toHaveLength(2);
        expect(mockParser.parseJobs).toHaveBeenCalledTimes(2);
      });

      it('should stop when maxPages is reached', async () => {
        mockParser.parseJobs.mockReturnValue([mockJobs[0]]);
        mockParser.hasNextPage.mockReturnValue(true);

        const jobs = await (scraper as any).scrapeWithVersion('v1', 2, 10);

        expect(jobs).toHaveLength(2);
        expect(mockParser.parseJobs).toHaveBeenCalledTimes(2);
      });

      it('should throw error when parser not found', async () => {
        await expect(
          (scraper as any).scrapeWithVersion('nonexistent', 1, 10),
        ).rejects.toThrow("Parser for version nonexistent not found");
      });

      it('should handle HTTP errors on first page', async () => {
        jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(
          new Error('HTTP 500: Internal Server Error'),
        );

        await expect(
          (scraper as any).scrapeWithVersion('v1', 1, 10),
        ).rejects.toThrow('HTTP 500: Internal Server Error');
      });

      it('should continue scraping on subsequent page errors', async () => {
        mockParser.parseJobs
          .mockReturnValueOnce([mockJobs[0]])
          .mockReturnValueOnce([]);
        mockParser.hasNextPage.mockReturnValue(true);

        jest.spyOn(scraper as any, 'makeRequest')
          .mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('<html>page 1</html>'),
          } as any)
          .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'));

        const jobs = await (scraper as any).scrapeWithVersion('v1', 3, 10);

        expect(jobs).toHaveLength(1);
      });
    });

    describe('detectVersion', () => {
      it('should detect v2 version', async () => {
        jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<html><div class="job-listing">v2</div></html>'),
        } as any);

        const version = await (scraper as any).detectVersion();

        expect(version).toBe('v2');
      });

      it('should detect v1 version', async () => {
        jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<html><div class="job">v1</div></html>'),
        } as any);

        const version = await (scraper as any).detectVersion();

        expect(version).toBe('v1');
      });

      it('should return null for unknown version', async () => {
        jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<html><div>unknown</div></html>'),
        } as any);

        const version = await (scraper as any).detectVersion();

        expect(version).toBeNull();
      });

      it('should return null on HTTP error', async () => {
        jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(
          new Error('Network error'),
        );

        const version = await (scraper as any).detectVersion();

        expect(version).toBeNull();
      });

      it('should return null on non-OK response', async () => {
        jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
          ok: false,
          status: 404,
        } as any);

        const version = await (scraper as any).detectVersion();

        expect(version).toBeNull();
      });
    });

    describe('buildPageUrl', () => {
      it('should return base URL for page 1', () => {
        const url = (scraper as any).buildPageUrl(1);
        expect(url).toBe('https://remoteok.com');
      });

      it('should return paginated URL for other pages', () => {
        const url = (scraper as any).buildPageUrl(2);
        expect(url).toBe('https://remoteok.com?page=2');
      });
    });
  });

  describe('health and version methods', () => {
    it('should check health successfully', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
      } as any);

      const isHealthy = await scraper.isHealthy();

      expect(isHealthy).toBe(true);
    });

    it('should return false on health check failure', async () => {
      jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(
        new Error('Network error'),
      );

      const isHealthy = await scraper.isHealthy();

      expect(isHealthy).toBe(false);
    });

    it('should return current version', () => {
      const version = scraper.getCurrentVersion();
      expect(version).toBe('v1');
    });

    it('should return available versions', () => {
      const versions = scraper.getAvailableVersions();
      expect(versions).toContain('v1');
    });
  });

  describe('error handling and logging', () => {
    it('should log appropriate messages during scraping', async () => {
      const logSpy = jest.spyOn(scraper['logger'], 'log');
      const warnSpy = jest.spyOn(scraper['logger'], 'warn');
      const errorSpy = jest.spyOn(scraper['logger'], 'error');

      mockParser.parseJobs.mockReturnValue(mockJobs);
      mockParser.hasNextPage.mockReturnValue(false);

      await scraper.scrapeJobs();

      expect(logSpy).toHaveBeenCalledWith(
        'Starting RemoteOK scraping (version: v1)',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully scraped 2 jobs from RemoteOK',
      );
    });

    it('should handle and log errors appropriately', async () => {
      const errorSpy = jest.spyOn(scraper['logger'], 'error');
      const warnSpy = jest.spyOn(scraper['logger'], 'warn');

      jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(
        new Error('Network error'),
      );

      await expect(scraper.scrapeJobs()).rejects.toThrow(
        'All RemoteOK scraper versions failed',
      );

      expect(errorSpy).toHaveBeenCalled();
    });
  });
}); 