import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInScraper } from './linkedin-scraper';
import { LinkedInV1Parser } from './v1/linkedin-v1.parser';
import { Job } from '../base/interfaces';

describe('LinkedInScraper', () => {
  let scraper: LinkedInScraper;
  let mockParser: jest.Mocked<LinkedInV1Parser>;

  const mockJob: Job = {
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    applyLink: 'https://linkedin.com/jobs/view/123',
    postedDate: new Date('2025-01-01'),
    salary: '$120k - $150k',
    tags: ['React', 'Node.js', 'TypeScript'],
    status: 'ACTIVE',
    applied: false,
    dateScraped: new Date(),
    lastUpdated: new Date(),
    searchText: 'senior software engineer techcorp san francisco ca',
    source: 'LinkedIn',
    sourceId: 'senior-software-engineer-techcorp',
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
        LinkedInScraper,
        {
          provide: LinkedInV1Parser,
          useValue: mockParser,
        },
      ],
    }).compile();

    scraper = module.get<LinkedInScraper>(LinkedInScraper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct properties', () => {
      expect(scraper.name).toBe('LinkedIn');
      expect(scraper.version).toBe('v1');
      expect(scraper.baseUrl).toBe('https://linkedin.com/jobs');
    });

    it('should have appropriate rate limits', () => {
      const rateLimit = scraper.getRateLimit();
      expect(rateLimit.requestsPerMinute).toBe(20);
      expect(rateLimit.delayBetweenRequests.min).toBe(3000);
      expect(rateLimit.delayBetweenRequests.max).toBe(8000);
      expect(rateLimit.maxConcurrentRequests).toBe(1);
    });
  });

  describe('scrapeJobs', () => {
    it('should successfully scrape jobs with default options', async () => {
      const mockHtml = '<div class="job-search-card">Job content</div>';
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
      const mockHtml = '<div class="job-search-card">Job content</div>';
      mockParser.parseJobs.mockReturnValue([mockJob]);
      mockParser.hasNextPage.mockReturnValue(true);
      
      // Mock the sleep method to avoid delays
      jest.spyOn(scraper as any, 'sleep').mockResolvedValue(undefined);
      
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      const result = await scraper.scrapeJobs({ maxPages: 2 });
      expect(mockParser.parseJobs).toHaveBeenCalledTimes(2);
    });

    it('should respect maxJobs option', async () => {
      const mockHtml = '<div class="job-search-card">Job content</div>';
      const multipleJobs = [mockJob, { ...mockJob, title: 'Job 2' }, { ...mockJob, title: 'Job 3' }];
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
      await expect(scraper.scrapeJobs()).rejects.toThrow('All LinkedIn scraper versions failed');
    });

    it('should handle parsing errors gracefully', async () => {
      mockParser.parseJobs.mockReturnValue([]);
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>No jobs here</div>'),
      });
      await expect(scraper.scrapeJobs()).rejects.toThrow('All LinkedIn scraper versions failed');
    });
  });

  describe('version detection', () => {
    it('should detect v2 structure', async () => {
      const v2Html = '<div class="job-card-container">New structure</div>';
      
      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(v2Html),
      });

      const version = await (scraper as any).detectVersion();
      expect(version).toBe('v2');
    });

    it('should detect v1 structure', async () => {
      const v1Html = '<div class="job-search-card">Old structure</div>';
      
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

      expect(page1Url).toBe('https://linkedin.com/jobs');
      expect(page2Url).toBe('https://linkedin.com/jobs?start=25');
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
      jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(new Error('Network error'));

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
      jest.spyOn(scraper as any, 'makeRequest').mockRejectedValue(new Error('Timeout'));

      await expect(scraper.scrapeJobs()).rejects.toThrow('All LinkedIn scraper versions failed');
    });

    it('should handle malformed HTML', async () => {
      mockParser.parseJobs.mockImplementation(() => {
        throw new Error('Malformed HTML');
      });

      jest.spyOn(scraper as any, 'makeRequest').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<malformed>html'),
      });

      await expect(scraper.scrapeJobs()).rejects.toThrow('All LinkedIn scraper versions failed');
    });
  });
}); 