import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, Page } from 'puppeteer';

// Types for job data
export interface JobListing {
  title: string;
  company: string;
  location: string;
  applyLink: string;
  postedDate?: string;
  salary?: string;
  tags?: string[];
}

export interface ScrapingOptions {
  maxPages?: number;
  delay?: number;
  headless?: boolean;
  userAgent?: string;
}

@Injectable()
export class RemoteOKService {
  private readonly logger = new Logger(RemoteOKService.name);
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(private configService: ConfigService) {}

  async scrapeJobs(options: ScrapingOptions = {}): Promise<JobListing[]> {
    const scraperConfig = this.configService.get('scraper');
    const defaultOptions: ScrapingOptions = {
      maxPages: scraperConfig.maxPages,
      delay: scraperConfig.delay,
      headless: scraperConfig.headless,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options,
    };

    try {
      await this.initialize(defaultOptions);
      const jobs = await this.performScraping(defaultOptions);
      return jobs;
    } finally {
      await this.close();
    }
  }

  private async initialize(options: ScrapingOptions): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      this.page = await this.browser.newPage();

      // Set user agent
      await this.page.setUserAgent(options.userAgent!);

      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Enable request interception to block unnecessary resources
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      this.logger.log('✅ Browser initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  private async performScraping(
    options: ScrapingOptions,
  ): Promise<JobListing[]> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const allJobs: JobListing[] = [];
    let currentPage = 1;

    try {
      this.logger.log(
        '🚀 Starting to scrape RemoteOK for software developer jobs...',
      );

      while (currentPage <= options.maxPages!) {
        this.logger.log(`📄 Scraping page ${currentPage}...`);

        const url =
          currentPage === 1
            ? 'https://remoteok.com/remote-dev-jobs'
            : `https://remoteok.com/remote-dev-jobs?page=${currentPage}`;

        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Wait for content to load
        await this.delay(3000);

        // Take a screenshot for debugging (only in development)
        if (
          this.configService.get('app.nodeEnv') === 'development' &&
          this.configService.get('app.debugScreenshots') === 'true'
        ) {
          await this.page.screenshot({ path: `debug-page-${currentPage}.png` });
          this.logger.log(
            `📸 Screenshot saved as debug-page-${currentPage}.png`,
          );
        }

        // Extract jobs from current page
        const pageJobs = await this.extractJobsFromPage();

        if (pageJobs.length === 0) {
          this.logger.log('No more jobs found, stopping pagination');
          break;
        }

        allJobs.push(...pageJobs);
        this.logger.log(
          `✅ Found ${pageJobs.length} jobs on page ${currentPage}`,
        );

        // Check if there are more pages
        const hasNextPage = await this.checkForNextPage();
        if (!hasNextPage) {
          this.logger.log('No next page found, stopping pagination');
          break;
        }

        currentPage++;

        // Add delay between requests to be respectful
        if (currentPage <= options.maxPages!) {
          this.logger.log(`⏳ Waiting ${options.delay}ms before next page...`);
          await this.delay(options.delay!);
        }
      }

      this.logger.log(
        `🎉 Scraping completed! Total jobs found: ${allJobs.length}`,
      );
      return allJobs;
    } catch (error) {
      this.logger.error('❌ Error during scraping:', error);
      throw error;
    }
  }

  private async extractJobsFromPage(): Promise<JobListing[]> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate(() => {
      const jobs: JobListing[] = [];

      // Try multiple selectors to find job listings
      const selectors = [
        'tr.job',
        'tr[data-href]',
        '.job',
        '[data-job]',
        'tr:has(td)',
        'tbody tr',
      ];

      let jobRows: NodeListOf<Element> | null = null;
      let usedSelector = '';

      for (const selector of selectors) {
        const rows = document.querySelectorAll(selector);
        if (rows.length > 0) {
          jobRows = rows;
          usedSelector = selector;
          console.log(`Found ${rows.length} jobs using selector: ${selector}`);
          break;
        }
      }

      if (!jobRows || jobRows.length === 0) {
        console.log('No job rows found with any selector');
        return jobs;
      }

      jobRows.forEach((row, index) => {
        try {
          // Extract job title and link - look for the main job link
          const titleElement = row.querySelector(
            'h2 a, h3 a, .job-title a, a[href*="/remote-jobs/"]',
          );
          let title = titleElement?.textContent?.trim() || '';
          const applyLink = titleElement?.getAttribute('href') || '';
          const fullApplyLink = applyLink.startsWith('http')
            ? applyLink
            : `https://remoteok.com${applyLink}`;

          // Extract company name - look for company information in different positions
          const companySelectors = [
            'h3 a',
            '.company a',
            '[data-company]',
            'td:nth-child(2) a',
            'td:nth-child(3) a',
            'td a:not([href*="/remote-jobs/"])',
          ];

          let company = '';
          for (const selector of companySelectors) {
            const element = row.querySelector(selector);
            if (element && element.textContent?.trim()) {
              company = element.textContent.trim();
              break;
            }
          }

          // If title looks like an abbreviation (1-3 characters), it might be swapped with company
          if (title.length <= 3 && company.length > 3) {
            const temp = title;
            title = company;
            company = temp;
          }

          // Extract location
          const locationElement = row.querySelector(
            'td.location, .location, [data-location]',
          );
          const location = locationElement?.textContent?.trim() || 'Remote';

          // Extract posted date
          const dateElement = row.querySelector('td.time, .time, [data-time]');
          const postedDate = dateElement?.textContent?.trim() || '';

          // Extract salary (if available)
          const salaryElement = row.querySelector(
            'td.salary, .salary, [data-salary]',
          );
          const salary = salaryElement?.textContent?.trim() || '';

          // Extract tags
          const tagElements = row.querySelectorAll(
            'td.tags a, .tags a, [data-tags] a',
          );
          const tags = Array.from(tagElements)
            .map((tag) => tag.textContent?.trim())
            .filter((tag): tag is string => Boolean(tag));

          if (title && company) {
            jobs.push({
              title,
              company,
              location,
              applyLink: fullApplyLink,
              postedDate,
              salary: salary || undefined,
              tags: tags.length > 0 ? tags : undefined,
            });
          }
        } catch (error) {
          console.warn(`Error parsing job row ${index}:`, error);
        }
      });

      return jobs;
    });
  }

  private async checkForNextPage(): Promise<boolean> {
    if (!this.page) return false;

    return await this.page.evaluate(() => {
      const nextButton = document.querySelector(
        'a[rel="next"], .next, .pagination .next',
      );
      return nextButton !== null;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.logger.log('🔒 Browser closed');
    }
  }
}
