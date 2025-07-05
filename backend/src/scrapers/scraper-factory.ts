import { Injectable, Logger } from '@nestjs/common';
import {
  IScraper,
  ScrapingOptions,
  Job,
  ScrapingMetrics,
  ScraperConfig,
} from './base/interfaces';
import { RemoteOKScraper } from './remoteok/remoteok-scraper';
import { LinkedInScraper } from './linkedin/linkedin-scraper';
import { LinkedInV1Parser } from './linkedin/v1/linkedin-v1.parser';
import { ArbeitnowScraper } from './arbeitnow/arbeitnow-scraper';
import { ArbeitnowV1Parser } from './arbeitnow/v1/arbeitnow-v1.parser';
import { RelocateScraper } from './relocate/relocate-scraper';
import { RelocateV1Parser } from './relocate/v1/relocate-v1.parser';

@Injectable()
export class ScraperFactory {
  private readonly logger = new Logger(ScraperFactory.name);
  private scrapers: Map<string, IScraper> = new Map();
  private configs: Map<string, ScraperConfig> = new Map();

  constructor() {
    this.initializeScrapers();
    this.initializeConfigs();
  }

  private initializeScrapers() {
    // Register all scrapers
    this.registerScraper('remoteok', new RemoteOKScraper());
    this.registerScraper(
      'linkedin',
      new LinkedInScraper(new LinkedInV1Parser()),
    );
    this.registerScraper(
      'arbeitnow',
      new ArbeitnowScraper(new ArbeitnowV1Parser()),
    );
    this.registerScraper(
      'relocate',
      new RelocateScraper(new RelocateV1Parser()),
    );
    // Add more scrapers as needed:
    // this.registerScraper('weworkremotely', new WeWorkRemotelyScraper());
    // this.registerScraper('stackoverflow', new StackOverflowScraper());
  }

  private initializeConfigs() {
    // Default configurations for each scraper
    this.configs.set('remoteok', {
      enabled: true,
      rateLimit: {
        requestsPerMinute: 30,
        delayBetweenRequests: { min: 2000, max: 5000 },
        maxConcurrentRequests: 1,
      },
      retryAttempts: 3,
      timeout: 30000,
      userAgents: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    this.configs.set('linkedin', {
      enabled: true,
      rateLimit: {
        requestsPerMinute: 20,
        delayBetweenRequests: { min: 3000, max: 8000 },
        maxConcurrentRequests: 1,
      },
      retryAttempts: 3,
      timeout: 30000,
      userAgents: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    this.configs.set('arbeitnow', {
      enabled: true,
      rateLimit: {
        requestsPerMinute: 30,
        delayBetweenRequests: { min: 2000, max: 5000 },
        maxConcurrentRequests: 2,
      },
      retryAttempts: 3,
      timeout: 30000,
      userAgents: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    this.configs.set('relocate', {
      enabled: true,
      rateLimit: {
        requestsPerMinute: 25,
        delayBetweenRequests: { min: 2500, max: 6000 },
        maxConcurrentRequests: 2,
      },
      retryAttempts: 3,
      timeout: 30000,
      userAgents: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    // Add more configurations as needed
  }

  registerScraper(name: string, scraper: IScraper) {
    this.scrapers.set(name, scraper);
    this.logger.log(`Registered scraper: ${name}`);
  }

  getScraper(name: string): IScraper {
    const scraper = this.scrapers.get(name);
    if (!scraper) {
      throw new Error(`Scraper '${name}' not found`);
    }
    return scraper;
  }

  getAllScrapers(): IScraper[] {
    return Array.from(this.scrapers.values());
  }

  getEnabledScrapers(): IScraper[] {
    return this.getAllScrapers().filter((scraper) => {
      const config = this.configs.get(scraper.name.toLowerCase());
      return config?.enabled !== false;
    });
  }

  async scrapeAll(options?: ScrapingOptions): Promise<Job[]> {
    const enabledScrapers = this.getEnabledScrapers();
    const allJobs: Job[] = [];

    this.logger.log(
      `Starting scraping with ${enabledScrapers.length} enabled scrapers`,
    );

    for (const scraper of enabledScrapers) {
      try {
        this.logger.log(`Scraping ${scraper.name}...`);
        const jobs = await scraper.scrapeJobs(options);
        allJobs.push(...jobs);
        this.logger.log(
          `Successfully scraped ${jobs.length} jobs from ${scraper.name}`,
        );
      } catch (error) {
        this.logger.error(`Failed to scrape ${scraper.name}:`, error);
      }
    }

    this.logger.log(`Total jobs scraped: ${allJobs.length}`);
    return allJobs;
  }

  async scrapeSpecific(
    scraperNames: string[],
    options?: ScrapingOptions,
  ): Promise<Job[]> {
    const allJobs: Job[] = [];

    for (const name of scraperNames) {
      try {
        const scraper = this.getScraper(name);
        this.logger.log(`Scraping ${scraper.name}...`);
        const jobs = await scraper.scrapeJobs(options);
        allJobs.push(...jobs);
        this.logger.log(
          `Successfully scraped ${jobs.length} jobs from ${scraper.name}`,
        );
      } catch (error) {
        this.logger.error(`Failed to scrape ${name}:`, error);
      }
    }

    return allJobs;
  }

  getScraperMetrics(): Record<string, ScrapingMetrics> {
    const metrics: Record<string, ScrapingMetrics> = {};

    for (const scraper of this.getAllScrapers()) {
      if ('getMetrics' in scraper) {
        metrics[scraper.name] = (scraper as any).getMetrics();
      }
    }

    return metrics;
  }

  getScraperHealth(): Record<string, boolean> {
    const health: Record<string, boolean> = {};

    for (const scraper of this.getAllScrapers()) {
      health[scraper.name] = false; // Default to false, will be updated by health checks
    }

    return health;
  }

  async checkAllScrapersHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const scraper of this.getAllScrapers()) {
      try {
        health[scraper.name] = await scraper.isHealthy();
      } catch (error) {
        this.logger.error(`Health check failed for ${scraper.name}:`, error);
        health[scraper.name] = false;
      }
    }

    return health;
  }

  getScraperConfig(name: string): ScraperConfig | undefined {
    return this.configs.get(name.toLowerCase());
  }

  updateScraperConfig(name: string, config: Partial<ScraperConfig>) {
    const existing = this.configs.get(name.toLowerCase()) || {};
    const updatedConfig = { ...existing, ...config };
    this.configs.set(name.toLowerCase(), updatedConfig as ScraperConfig);
    this.logger.log(`Updated config for scraper: ${name}`);
  }

  getAvailableScrapers(): string[] {
    return Array.from(this.scrapers.keys());
  }

  getScraperInfo(): Array<{
    name: string;
    version: string;
    baseUrl: string;
    enabled: boolean;
  }> {
    return this.getAllScrapers().map((scraper) => {
      const config = this.configs.get(scraper.name.toLowerCase());
      return {
        name: scraper.name,
        version: scraper.version,
        baseUrl: scraper.baseUrl,
        enabled: config?.enabled !== false,
      };
    });
  }
}
