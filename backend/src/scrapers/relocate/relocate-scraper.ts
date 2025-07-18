import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseScraper } from '../base/base-scraper.abstract';
import { RateLimitConfig, ScrapingOptions, Job } from '../base/interfaces';
import { RelocateV1Parser } from './v1/relocate-v1.parser';

@Injectable()
export class RelocateScraper extends BaseScraper {
  protected readonly logger = new Logger(RelocateScraper.name);
  readonly baseUrl: string;

  readonly name = 'Relocate.me';
  readonly version = 'v1';

  private currentVersion: string = 'v1';
  private versions: Map<string, RelocateV1Parser> = new Map();

  constructor(
    protected configService: ConfigService,
    private readonly relocateV1Parser: RelocateV1Parser,
  ) {
    super();
    this.baseUrl =
      this.configService.get<string>('RELOCATE_BASE_URL') ||
      'https://relocate.me';
    this.versions.set('v1', relocateV1Parser);

    // Update metrics version
    this.metrics.version = this.currentVersion;
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 25, // Relocate.me is moderately restrictive
      delayBetweenRequests: { min: 2500, max: 6000 }, // 2.5-6 seconds
      maxConcurrentRequests: 2, // Allow some concurrency
    };
  }

  async scrapeJobs(options?: ScrapingOptions): Promise<Job[]> {
    const maxPages = options?.maxPages || 4;
    const maxJobs = options?.maxJobs || 80;
    const allJobs: Job[] = [];

    this.logger.log(
      `Starting Relocate.me scraping (version: ${this.currentVersion})`,
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
          `Relocate.me structure changed, switching to ${detectedVersion}`,
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
      throw new Error('All Relocate.me scraper versions failed');
    }

    this.logger.log(
      `Successfully scraped ${allJobs.length} jobs from Relocate.me`,
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
        await this.sleep(4000 + Math.random() * 2000);
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
      if (html.includes('job-listing') || html.includes('job-grid')) {
        return 'v2';
      }

      // Check for v1 indicators
      if (html.includes('job-card') || html.includes('pagination')) {
        return 'v1';
      }

      return null;
    } catch (error) {
      this.logger.error('Relocate.me version detection failed:', error);
      return null;
    }
  }

  private buildPageUrl(page: number): string {
    if (page === 1) {
      return `${this.baseUrl}/jobs`;
    }
    return `${this.baseUrl}/jobs?page=${page}`;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/jobs`);
      return response.ok;
    } catch (error) {
      this.logger.error('Relocate.me health check failed:', error);
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
