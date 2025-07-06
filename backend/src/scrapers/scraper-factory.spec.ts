import { Test, TestingModule } from '@nestjs/testing';
import { ScraperFactory } from './scraper-factory';
import { RemoteOKScraper } from './remoteok/remoteok-scraper';
import { LinkedInScraper } from './linkedin/linkedin-scraper';
import { ArbeitnowScraper } from './arbeitnow/arbeitnow-scraper';
import { RelocateScraper } from './relocate/relocate-scraper';
import { Job, IScraper } from './base/interfaces';

// Mock interface for testing
interface MockScraper extends Partial<IScraper> {
  name: string;
  scrapeJobs: jest.MockedFunction<IScraper['scrapeJobs']>;
  isHealthy: jest.MockedFunction<IScraper['isHealthy']>;
}

describe('ScraperFactory', () => {
  let factory: ScraperFactory;

  const mockJob: Job = {
    title: 'Software Engineer',
    company: 'TestCorp',
    location: 'Remote',
    applyLink: 'https://example.com/job',
    postedDate: new Date(),
    salary: '$100k',
    tags: ['React', 'Node.js'],
    status: 'ACTIVE',
    applied: false,
    dateScraped: new Date(),
    lastUpdated: new Date(),
    searchText: 'software engineer testcorp remote',
    source: 'Test',
    sourceId: 'software-engineer-testcorp',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScraperFactory],
    }).compile();

    factory = module.get<ScraperFactory>(ScraperFactory);
  });

  describe('initialization', () => {
    it('should register all scrapers', () => {
      const scrapers = factory.getAllScrapers();

      expect(scrapers).toHaveLength(4);
      expect(scrapers.some((s) => s.name === 'RemoteOK')).toBe(true);
      expect(scrapers.some((s) => s.name === 'LinkedIn')).toBe(true);
      expect(scrapers.some((s) => s.name === 'Arbeitnow')).toBe(true);
      expect(scrapers.some((s) => s.name === 'Relocate.me')).toBe(true);
    });

    it('should have configurations for all scrapers', () => {
      const remoteokConfig = factory.getScraperConfig('remoteok');
      const linkedinConfig = factory.getScraperConfig('linkedin');
      const arbeitnowConfig = factory.getScraperConfig('arbeitnow');
      const relocateConfig = factory.getScraperConfig('relocate');

      expect(remoteokConfig).toBeDefined();
      expect(linkedinConfig).toBeDefined();
      expect(arbeitnowConfig).toBeDefined();
      expect(relocateConfig).toBeDefined();
    });
  });

  describe('scraper retrieval', () => {
    it('should get scraper by name', () => {
      const remoteokScraper = factory.getScraper('remoteok');
      const linkedinScraper = factory.getScraper('linkedin');
      const arbeitnowScraper = factory.getScraper('arbeitnow');
      const relocateScraper = factory.getScraper('relocate');

      expect(remoteokScraper).toBeInstanceOf(RemoteOKScraper);
      expect(linkedinScraper).toBeInstanceOf(LinkedInScraper);
      expect(arbeitnowScraper).toBeInstanceOf(ArbeitnowScraper);
      expect(relocateScraper).toBeInstanceOf(RelocateScraper);
    });

    it('should throw error for unknown scraper', () => {
      expect(() => factory.getScraper('unknown')).toThrow(
        "Scraper 'unknown' not found",
      );
    });

    it('should return all scrapers', () => {
      const scrapers = factory.getAllScrapers();
      expect(scrapers.length).toBeGreaterThan(0);
    });

    it('should return enabled scrapers', () => {
      const enabledScrapers = factory.getEnabledScrapers();
      expect(enabledScrapers.length).toBeGreaterThan(0);

      // All scrapers should be enabled by default
      expect(enabledScrapers.length).toBe(4);
    });
  });

  describe('scraping operations', () => {
    it('should scrape from specific scraper', async () => {
      const mockScraper: MockScraper = {
        name: 'test',
        scrapeJobs: jest.fn().mockResolvedValue([mockJob]),
        isHealthy: jest.fn().mockResolvedValue(true),
      };

      factory.registerScraper('test', mockScraper as IScraper);

      const jobs = await factory.scrapeSpecific(['test']);

      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual(mockJob);
      expect(mockScraper.scrapeJobs).toHaveBeenCalled();
    });

    it('should scrape from all enabled scrapers', async () => {
      // Mock the actual scrapers to avoid real HTTP calls
      const mockRemoteOKScraper: MockScraper = {
        name: 'RemoteOK',
        scrapeJobs: jest.fn().mockResolvedValue([mockJob]),
        isHealthy: jest.fn().mockResolvedValue(true),
      };
      const mockLinkedInScraper: MockScraper = {
        name: 'LinkedIn',
        scrapeJobs: jest.fn().mockResolvedValue([mockJob]),
        isHealthy: jest.fn().mockResolvedValue(true),
      };
      const mockArbeitnowScraper: MockScraper = {
        name: 'Arbeitnow',
        scrapeJobs: jest.fn().mockResolvedValue([mockJob]),
        isHealthy: jest.fn().mockResolvedValue(true),
      };
      const mockRelocateScraper: MockScraper = {
        name: 'Relocate.me',
        scrapeJobs: jest.fn().mockResolvedValue([mockJob]),
        isHealthy: jest.fn().mockResolvedValue(true),
      };

      // Replace the real scrapers with mocks
      factory.registerScraper('remoteok', mockRemoteOKScraper as IScraper);
      factory.registerScraper('linkedin', mockLinkedInScraper as IScraper);
      factory.registerScraper('arbeitnow', mockArbeitnowScraper as IScraper);
      factory.registerScraper('relocate', mockRelocateScraper as IScraper);

      const jobs = await factory.scrapeAll();

      expect(jobs.length).toBeGreaterThan(0);
      expect(mockRemoteOKScraper.scrapeJobs).toHaveBeenCalled();
      expect(mockLinkedInScraper.scrapeJobs).toHaveBeenCalled();
      expect(mockArbeitnowScraper.scrapeJobs).toHaveBeenCalled();
      expect(mockRelocateScraper.scrapeJobs).toHaveBeenCalled();
    });

    it('should handle scraper failures gracefully', async () => {
      const mockScraper: MockScraper = {
        name: 'failing',
        scrapeJobs: jest.fn().mockRejectedValue(new Error('Scraping failed')),
        isHealthy: jest.fn().mockResolvedValue(true),
      };

      factory.registerScraper('failing', mockScraper as IScraper);

      const jobs = await factory.scrapeSpecific(['failing']);

      expect(jobs).toHaveLength(0);
      expect(mockScraper.scrapeJobs).toHaveBeenCalled();
    });
  });

  describe('configuration management', () => {
    it('should get scraper configuration', () => {
      const config = factory.getScraperConfig('remoteok');

      expect(config).toBeDefined();
      expect(config!.enabled).toBe(true);
      expect(config!.rateLimit).toBeDefined();
      expect(config!.retryAttempts).toBeDefined();
    });

    it('should update scraper configuration', () => {
      const newConfig = { enabled: false };

      factory.updateScraperConfig('remoteok', newConfig);

      const updatedConfig = factory.getScraperConfig('remoteok');
      expect(updatedConfig!.enabled).toBe(false);
    });

    it('should return available scrapers', () => {
      const available = factory.getAvailableScrapers();

      expect(available).toContain('remoteok');
      expect(available).toContain('linkedin');
      expect(available).toContain('arbeitnow');
      expect(available).toContain('relocate');
    });
  });

  describe('scraper information', () => {
    it('should return scraper info', () => {
      const info = factory.getScraperInfo();

      expect(info.length).toBe(4);

      const remoteokInfo = info.find((s) => s.name === 'RemoteOK');
      const linkedinInfo = info.find((s) => s.name === 'LinkedIn');
      const arbeitnowInfo = info.find((s) => s.name === 'Arbeitnow');
      const relocateInfo = info.find((s) => s.name === 'Relocate.me');

      expect(remoteokInfo).toBeDefined();
      expect(linkedinInfo).toBeDefined();
      expect(arbeitnowInfo).toBeDefined();
      expect(relocateInfo).toBeDefined();

      expect(remoteokInfo!.enabled).toBe(true);
      expect(linkedinInfo!.enabled).toBe(true);
      expect(arbeitnowInfo!.enabled).toBe(true);
      expect(relocateInfo!.enabled).toBe(true);
    });
  });

  describe('health checks', () => {
    it('should check all scrapers health', async () => {
      const health = await factory.checkAllScrapersHealth();

      expect(health).toBeDefined();
      expect(typeof health['RemoteOK']).toBe('boolean');
      expect(typeof health['LinkedIn']).toBe('boolean');
      expect(typeof health['Arbeitnow']).toBe('boolean');
      expect(typeof health['Relocate.me']).toBe('boolean');
    });

    it('should return health status object', () => {
      const health = factory.getScraperHealth();

      expect(health).toBeDefined();
      expect(health['RemoteOK']).toBe(false); // Default to false
      expect(health['LinkedIn']).toBe(false);
      expect(health['Arbeitnow']).toBe(false);
      expect(health['Relocate.me']).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should return scraper metrics', () => {
      const metrics = factory.getScraperMetrics();

      expect(metrics).toBeDefined();
      // Metrics will be empty if scrapers don't have getMetrics method
      expect(typeof metrics).toBe('object');
    });
  });

  describe('rate limiting configuration', () => {
    it('should have appropriate rate limits for LinkedIn', () => {
      const config = factory.getScraperConfig('linkedin');

      expect(config!.rateLimit.requestsPerMinute).toBe(20);
      expect(config!.rateLimit.delayBetweenRequests.min).toBe(3000);
      expect(config!.rateLimit.delayBetweenRequests.max).toBe(8000);
      expect(config!.rateLimit.maxConcurrentRequests).toBe(1);
    });

    it('should have appropriate rate limits for Arbeitnow', () => {
      const config = factory.getScraperConfig('arbeitnow');

      expect(config!.rateLimit.requestsPerMinute).toBe(30);
      expect(config!.rateLimit.delayBetweenRequests.min).toBe(2000);
      expect(config!.rateLimit.delayBetweenRequests.max).toBe(5000);
      expect(config!.rateLimit.maxConcurrentRequests).toBe(2);
    });

    it('should have appropriate rate limits for Relocate.me', () => {
      const config = factory.getScraperConfig('relocate');

      expect(config!.rateLimit.requestsPerMinute).toBe(25);
      expect(config!.rateLimit.delayBetweenRequests.min).toBe(2500);
      expect(config!.rateLimit.delayBetweenRequests.max).toBe(6000);
      expect(config!.rateLimit.maxConcurrentRequests).toBe(2);
    });

    it('should have appropriate rate limits for RemoteOK', () => {
      const config = factory.getScraperConfig('remoteok');

      expect(config!.rateLimit.requestsPerMinute).toBe(30);
      expect(config!.rateLimit.delayBetweenRequests.min).toBe(2000);
      expect(config!.rateLimit.delayBetweenRequests.max).toBe(5000);
      expect(config!.rateLimit.maxConcurrentRequests).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle scraper registration errors', () => {
      expect(() => factory.registerScraper('', {} as IScraper)).not.toThrow();
    });

    it('should handle configuration retrieval for unknown scraper', () => {
      const config = factory.getScraperConfig('unknown');
      expect(config).toBeUndefined();
    });

    it('should handle health check errors gracefully', async () => {
      const mockScraper: MockScraper = {
        name: 'error',
        scrapeJobs: jest.fn().mockResolvedValue([]),
        isHealthy: jest
          .fn()
          .mockRejectedValue(new Error('Health check failed')),
      };

      factory.registerScraper('error', mockScraper as IScraper);

      const health = await factory.checkAllScrapersHealth();
      expect(health.error).toBe(false);
    });
  });
});
