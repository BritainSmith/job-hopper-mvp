import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseScraper } from '../base/base-scraper.abstract';
import { RateLimitConfig, ScrapingOptions, Job } from '../base/interfaces';
import { RemoteOKV1Parser } from './v1/remoteok-v1.parser';

@Injectable()
export class RemoteOKScraper extends BaseScraper {
  protected readonly logger = new Logger(RemoteOKScraper.name);
  readonly baseUrl: string;

  readonly name = 'RemoteOK';
  readonly version = 'v1';

  private currentVersion: string = 'v1';
  private versions: Map<string, RemoteOKV1Parser> = new Map();

  constructor(protected configService: ConfigService) {
    super();
    this.baseUrl =
      this.configService.get<string>('REMOTEOK_BASE_URL') ||
      'https://remoteok.com';
    this.versions.set('v1', new RemoteOKV1Parser());
    // When v2 is implemented, add: this.versions.set('v2', new RemoteOKV2Parser());
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 30, // Conservative rate limit
      delayBetweenRequests: { min: 2000, max: 5000 }, // 2-5 seconds
      maxConcurrentRequests: 1, // Sequential requests only
    };
  }

  async scrapeJobs(options?: ScrapingOptions): Promise<Job[]> {
    const maxPages = options?.maxPages || 5;
    const maxJobs = options?.maxJobs || 100;
    const allJobs: Job[] = [];

    this.logger.log(
      `Starting RemoteOK scraping (version: ${this.currentVersion})`,
    );

    try {
      // Try current version first
      const jobs = await this.scrapeWithVersion(
        this.currentVersion,
        maxPages,
        maxJobs,
      );
      allJobs.push(...jobs);
    } catch {
      this.logger.warn(
        `Current version ${this.currentVersion} failed, attempting version detection`,
      );

      // Try to detect new version
      const detectedVersion = await this.detectVersion();
      if (detectedVersion && detectedVersion !== this.currentVersion) {
        this.currentVersion = detectedVersion;
        this.metrics.version = detectedVersion;
        this.logger.log(
          `RemoteOK structure changed, switching to ${detectedVersion}`,
        );

        try {
          const jobs = await this.scrapeWithVersion(
            detectedVersion,
            maxPages,
            maxJobs,
          );
          allJobs.push(...jobs);
        } catch (detectionError) {
          this.logger.error(
            `Detected version ${detectedVersion} also failed:`,
            detectionError,
          );
        }
      }

      // If detection fails, try fallback versions
      if (allJobs.length === 0) {
        for (const version of this.versions.keys()) {
          if (version !== this.currentVersion) {
            try {
              this.logger.log(`Trying fallback version: ${version}`);
              const jobs = await this.scrapeWithVersion(
                version,
                maxPages,
                maxJobs,
              );
              allJobs.push(...jobs);
              break; // Use first working fallback
            } catch (fallbackError) {
              this.logger.warn(`Fallback to ${version} failed:`, fallbackError);
            }
          }
        }
      }
    }

    if (allJobs.length === 0) {
      throw new Error('All RemoteOK scraper versions failed');
    }

    this.logger.log(
      `Successfully scraped ${allJobs.length} jobs from RemoteOK`,
    );
    return allJobs.slice(0, maxJobs);
  }

  private async scrapeWithVersion(
    version: string,
    maxPages: number,
    maxJobs: number,
  ): Promise<Job[]> {
    const parser = this.versions.get(version);
    if (!parser) {
      throw new Error(`Parser for version ${version} not found`);
    }

    const jobs: Job[] = [];
    let currentPage = 1;

    while (currentPage <= maxPages && jobs.length < maxJobs) {
      try {
        const pageUrl = this.buildPageUrl(currentPage);
        this.logger.debug(`Scraping page ${currentPage}: ${pageUrl}`);

        const response = await this.makeRequest(pageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const pageJobs = parser.parseJobs(html);

        if (pageJobs.length === 0) {
          this.logger.warn(`No jobs found on page ${currentPage}`);
          break;
        }

        jobs.push(...pageJobs);
        this.logger.debug(
          `Found ${pageJobs.length} jobs on page ${currentPage}`,
        );

        // Check if there's a next page
        if (!parser.hasNextPage(html)) {
          this.logger.debug('No more pages available');
          break;
        }

        currentPage++;

        // Add delay between pages
        await this.sleep(3000 + Math.random() * 2000);
      } catch (error) {
        this.logger.error(`Failed to scrape page ${currentPage}:`, error);

        // If it's the first page, the version might be broken
        if (currentPage === 1) {
          throw error;
        }

        // For subsequent pages, just stop
        break;
      }
    }

    return jobs;
  }

  private async detectVersion(): Promise<string | null> {
    try {
      const response = await this.makeRequest(this.baseUrl);
      if (!response.ok) {
        return null;
      }

      const html = await response.text();

      // Check for v2 indicators (update these based on actual HTML changes)
      if (html.includes('job-listing') || html.includes('company-name')) {
        return 'v2';
      }

      // Check for v1 indicators
      if (html.includes('class="job"') || html.includes('h2')) {
        return 'v1';
      }

      return null;
    } catch (error) {
      this.logger.error('Version detection failed:', error);
      return null;
    }
  }

  private buildPageUrl(page: number): string {
    if (page === 1) {
      return this.baseUrl;
    }
    return `${this.baseUrl}?page=${page}`;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest(this.baseUrl);
      return response.ok;
    } catch (error) {
      this.logger.error('RemoteOK health check failed:', error);
      return false;
    }
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getAvailableVersions(): string[] {
    return Array.from(this.versions.keys());
  }
}
