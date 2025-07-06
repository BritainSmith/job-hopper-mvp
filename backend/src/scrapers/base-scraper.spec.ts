import { Test, TestingModule } from '@nestjs/testing';
import { BaseScraper } from './base/base-scraper.abstract';
import { Job, RateLimitConfig } from './base/interfaces';

// Create a concrete test implementation
class TestScraper extends BaseScraper {
  name = 'TestScraper';
  version = 'v1';
  baseUrl = 'https://test.com';

  scrapeJobs(): Promise<Job[]> {
    return Promise.resolve([]);
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 60,
      delayBetweenRequests: { min: 1000, max: 2000 },
      maxConcurrentRequests: 1,
    };
  }

  // Expose protected methods for testing
  public async testMakeRequest(url: string) {
    return this.makeRequest(url);
  }
}

describe('BaseScraper', () => {
  let scraper: TestScraper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestScraper],
    }).compile();

    scraper = module.get<TestScraper>(TestScraper);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('makeRequest', () => {
    it('should make successful HTTP request', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('<html>Test content</html>'),
        headers: { get: jest.fn().mockReturnValue(undefined) },
      };

      // Mock fetch globally
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await scraper.testMakeRequest('https://example.com');

      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        }),
      );
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: jest.fn().mockReturnValue(undefined) },
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(
        scraper.testMakeRequest('https://example.com'),
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        scraper.testMakeRequest('https://example.com'),
      ).rejects.toThrow('Network error');
    });

    it('should respect rate limiting', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('<html>Test content</html>'),
        headers: { get: jest.fn().mockReturnValue(undefined) },
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await scraper.testMakeRequest('https://example.com');
      await scraper.testMakeRequest('https://example.com');
      const endTime = Date.now();

      // Should have at least 1 second delay between requests
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });
});
