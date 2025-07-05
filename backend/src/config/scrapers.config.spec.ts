import { scrapersConfig, ScraperConfig } from './scrapers.config';

describe('Scrapers Configuration', () => {
  let config: any;

  beforeEach(() => {
    // Get the actual configuration by calling the function
    config = scrapersConfig();
  });

  describe('scrapersConfig', () => {
    it('should return configuration object with all scrapers', () => {
      expect(config).toHaveProperty('remoteok');
      expect(config).toHaveProperty('linkedin');
      expect(config).toHaveProperty('indeed');
    });

    it('should have correct structure for each scraper', () => {
      // Check RemoteOK scraper structure
      expect(config.remoteok).toHaveProperty('name');
      expect(config.remoteok).toHaveProperty('baseUrl');
      expect(config.remoteok).toHaveProperty('jobListUrl');
      expect(config.remoteok).toHaveProperty('selectors');
      expect(config.remoteok).toHaveProperty('options');
      expect(config.remoteok).toHaveProperty('dataTransformers');

      // Check LinkedIn scraper structure
      expect(config.linkedin).toHaveProperty('name');
      expect(config.linkedin).toHaveProperty('baseUrl');
      expect(config.linkedin).toHaveProperty('jobListUrl');
      expect(config.linkedin).toHaveProperty('selectors');
      expect(config.linkedin).toHaveProperty('options');
      expect(config.linkedin).toHaveProperty('dataTransformers');

      // Check Indeed scraper structure
      expect(config.indeed).toHaveProperty('name');
      expect(config.indeed).toHaveProperty('baseUrl');
      expect(config.indeed).toHaveProperty('jobListUrl');
      expect(config.indeed).toHaveProperty('selectors');
      expect(config.indeed).toHaveProperty('options');
      expect(config.indeed).toHaveProperty('dataTransformers');
    });
  });

  describe('RemoteOK Configuration', () => {
    it('should have correct RemoteOK basic properties', () => {
      expect(config.remoteok.name).toBe('RemoteOK');
      expect(config.remoteok.baseUrl).toBe('https://remoteok.com');
      expect(config.remoteok.jobListUrl).toBe(
        'https://remoteok.com/remote-dev-jobs',
      );
    });

    it('should have comprehensive selectors', () => {
      expect(config.remoteok.selectors).toHaveProperty('jobContainer');
      expect(config.remoteok.selectors).toHaveProperty('title');
      expect(config.remoteok.selectors).toHaveProperty('company');
      expect(config.remoteok.selectors).toHaveProperty('location');
      expect(config.remoteok.selectors).toHaveProperty('applyLink');
      expect(config.remoteok.selectors).toHaveProperty('postedDate');
      expect(config.remoteok.selectors).toHaveProperty('salary');
      expect(config.remoteok.selectors).toHaveProperty('tags');
      expect(config.remoteok.selectors).toHaveProperty('nextPage');
    });

    it('should have correct options', () => {
      expect(config.remoteok.options.delay).toBe(2000);
      expect(config.remoteok.options.maxPages).toBe(5);
      expect(config.remoteok.options.headless).toBe(true);
      expect(config.remoteok.options.userAgent).toContain('Mozilla/5.0');
    });

    it('should have data transformers', () => {
      expect(config.remoteok.dataTransformers).toHaveProperty('company');
      expect(config.remoteok.dataTransformers).toHaveProperty('applyLink');
      expect(config.remoteok.dataTransformers).toHaveProperty('location');
    });

    it('should have working data transformers', () => {
      const { dataTransformers } = config.remoteok;

      // Test company transformer
      expect(dataTransformers.company('Test')).toBe('Test');
      expect(dataTransformers.company('ABC')).toBe('ABC');

      // Test applyLink transformer
      expect(dataTransformers.applyLink('https://example.com')).toBe(
        'https://example.com',
      );
      expect(dataTransformers.applyLink('/remote-jobs/123')).toBe(
        'https://remoteok.com/remote-jobs/123',
      );

      // Test location transformer
      expect(dataTransformers.location('New York')).toBe('New York');
      expect(dataTransformers.location('')).toBe('Remote');
      expect(dataTransformers.location(null)).toBe('Remote');
    });
  });

  describe('LinkedIn Configuration', () => {
    it('should have correct LinkedIn basic properties', () => {
      expect(config.linkedin.name).toBe('LinkedIn');
      expect(config.linkedin.baseUrl).toBe('https://www.linkedin.com');
      expect(config.linkedin.jobListUrl).toContain('linkedin.com/jobs/search');
      expect(config.linkedin.jobListUrl).toContain('software%20developer');
      expect(config.linkedin.jobListUrl).toContain('Remote');
    });

    it('should have comprehensive selectors', () => {
      expect(config.linkedin.selectors).toHaveProperty('jobContainer');
      expect(config.linkedin.selectors).toHaveProperty('title');
      expect(config.linkedin.selectors).toHaveProperty('company');
      expect(config.linkedin.selectors).toHaveProperty('location');
      expect(config.linkedin.selectors).toHaveProperty('applyLink');
      expect(config.linkedin.selectors).toHaveProperty('postedDate');
      expect(config.linkedin.selectors).toHaveProperty('salary');
      expect(config.linkedin.selectors).toHaveProperty('tags');
      expect(config.linkedin.selectors).toHaveProperty('nextPage');
    });

    it('should have correct options', () => {
      expect(config.linkedin.options.delay).toBe(3000);
      expect(config.linkedin.options.maxPages).toBe(3);
      expect(config.linkedin.options.headless).toBe(true);
    });

    it('should have data transformers', () => {
      expect(config.linkedin.dataTransformers).toHaveProperty('applyLink');
    });

    it('should have working data transformers', () => {
      const { dataTransformers } = config.linkedin;

      // Test applyLink transformer
      expect(dataTransformers.applyLink('https://example.com')).toBe(
        'https://example.com',
      );
      expect(dataTransformers.applyLink('/jobs/view/123')).toBe(
        'https://www.linkedin.com/jobs/view/123',
      );
    });
  });

  describe('Indeed Configuration', () => {
    it('should have correct Indeed basic properties', () => {
      expect(config.indeed.name).toBe('Indeed');
      expect(config.indeed.baseUrl).toBe('https://www.indeed.com');
      expect(config.indeed.jobListUrl).toContain('indeed.com/jobs');
      expect(config.indeed.jobListUrl).toContain('software+developer');
      expect(config.indeed.jobListUrl).toContain('Remote');
    });

    it('should have comprehensive selectors', () => {
      expect(config.indeed.selectors).toHaveProperty('jobContainer');
      expect(config.indeed.selectors).toHaveProperty('title');
      expect(config.indeed.selectors).toHaveProperty('company');
      expect(config.indeed.selectors).toHaveProperty('location');
      expect(config.indeed.selectors).toHaveProperty('applyLink');
      expect(config.indeed.selectors).toHaveProperty('postedDate');
      expect(config.indeed.selectors).toHaveProperty('salary');
      expect(config.indeed.selectors).toHaveProperty('tags');
      expect(config.indeed.selectors).toHaveProperty('nextPage');
    });

    it('should have correct options', () => {
      expect(config.indeed.options.delay).toBe(2500);
      expect(config.indeed.options.maxPages).toBe(3);
      expect(config.indeed.options.headless).toBe(true);
    });

    it('should have data transformers', () => {
      expect(config.indeed.dataTransformers).toHaveProperty('applyLink');
    });

    it('should have working data transformers', () => {
      const { dataTransformers } = config.indeed;

      // Test applyLink transformer
      expect(dataTransformers.applyLink('https://example.com')).toBe(
        'https://example.com',
      );
      expect(dataTransformers.applyLink('/jobs/view/123')).toBe(
        'https://www.indeed.com/jobs/view/123',
      );
    });
  });

  describe('ScraperConfig Interface', () => {
    it('should define correct interface structure', () => {
      // This test ensures the interface is properly defined
      const mockConfig: ScraperConfig = {
        name: 'Test Scraper',
        baseUrl: 'https://example.com',
        jobListUrl: 'https://example.com/jobs',
        selectors: {
          jobContainer: ['.job'],
          title: ['.title'],
          company: ['.company'],
          location: ['.location'],
          applyLink: ['.apply'],
          postedDate: ['.date'],
          salary: ['.salary'],
          tags: ['.tags'],
          nextPage: ['.next'],
        },
        options: {
          delay: 1000,
          maxPages: 1,
          headless: true,
        },
      };

      expect(mockConfig.name).toBe('Test Scraper');
      expect(mockConfig.selectors).toBeDefined();
      expect(mockConfig.options).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid URLs for all scrapers', () => {
      // Test URL validity
      expect(config.remoteok.baseUrl).toMatch(/^https?:\/\//);
      expect(config.remoteok.jobListUrl).toMatch(/^https?:\/\//);
      expect(config.linkedin.baseUrl).toMatch(/^https?:\/\//);
      expect(config.linkedin.jobListUrl).toMatch(/^https?:\/\//);
      expect(config.indeed.baseUrl).toMatch(/^https?:\/\//);
      expect(config.indeed.jobListUrl).toMatch(/^https?:\/\//);
    });

    it('should have reasonable delay values', () => {
      expect(config.remoteok.options.delay).toBeGreaterThan(0);
      expect(config.linkedin.options.delay).toBeGreaterThan(0);
      expect(config.indeed.options.delay).toBeGreaterThan(0);
    });

    it('should have reasonable maxPages values', () => {
      expect(config.remoteok.options.maxPages).toBeGreaterThan(0);
      expect(config.linkedin.options.maxPages).toBeGreaterThan(0);
      expect(config.indeed.options.maxPages).toBeGreaterThan(0);
    });
  });
});
