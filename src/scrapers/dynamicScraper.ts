import puppeteer, { Browser, Page } from 'puppeteer';
import { ScraperConfig, getScraperConfig, validateScraperConfig } from '../config/scrapers';
import { JobListing } from './remoteok';

export interface DynamicScrapingOptions {
  maxPages?: number;
  delay?: number;
  headless?: boolean;
  userAgent?: string;
}

export class DynamicScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: ScraperConfig;

  constructor(scraperName: string) {
    const config = getScraperConfig(scraperName);
    if (!config) {
      throw new Error(`Scraper configuration not found for: ${scraperName}`);
    }
    
    const errors = validateScraperConfig(config);
    if (errors.length > 0) {
      throw new Error(`Invalid scraper configuration: ${errors.join(', ')}`);
    }
    
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: this.config.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set user agent
      const userAgent = this.config.options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      await this.page.setUserAgent(userAgent);
      
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

      console.log(`✅ Browser initialized for ${this.config.name}`);
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async scrapeJobs(options: DynamicScrapingOptions = {}): Promise<JobListing[]> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const allJobs: JobListing[] = [];
    let currentPage = 1;
    const maxPages = options.maxPages || this.config.options.maxPages;

    try {
      console.log(`🚀 Starting to scrape ${this.config.name} for software developer jobs...`);

      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}...`);
        
        const url = currentPage === 1 
          ? this.config.jobListUrl
          : this.buildPageUrl(currentPage);

        await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for content to load
        await this.delay(this.config.options.delay);
        
        // Take a screenshot for debugging (only in development)
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SCREENSHOTS === 'true') {
          await this.page.screenshot({ path: `debug-${this.config.name}-page-${currentPage}.png` });
          console.log(`📸 Screenshot saved as debug-${this.config.name}-page-${currentPage}.png`);
        }

        // Extract jobs from current page
        const pageJobs = await this.extractJobsFromPage();
        
        if (pageJobs.length === 0) {
          console.log('No more jobs found, stopping pagination');
          break;
        }

        allJobs.push(...pageJobs);
        console.log(`✅ Found ${pageJobs.length} jobs on page ${currentPage}`);

        // Check if there are more pages
        const hasNextPage = await this.checkForNextPage();
        if (!hasNextPage) {
          console.log('No next page found, stopping pagination');
          break;
        }

        currentPage++;
        
        // Add delay between requests to be respectful
        if (currentPage <= maxPages) {
          console.log(`⏳ Waiting ${this.config.options.delay}ms before next page...`);
          await this.delay(this.config.options.delay);
        }
      }

      console.log(`🎉 Scraping completed! Total jobs found: ${allJobs.length}`);
      return allJobs;

    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw error;
    }
  }

  private async extractJobsFromPage(): Promise<JobListing[]> {
    if (!this.page) throw new Error('Page not initialized');

    return await this.page.evaluate((config) => {
      const jobs: JobListing[] = [];
      
      // Try multiple selectors to find job listings
      let jobRows: NodeListOf<Element> | null = null;
      let usedSelector = '';
      
      for (const selector of config.selectors.jobContainer) {
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
          // Extract job data using configured selectors
          const title = this.extractText(row, config.selectors.title);
          const company = this.extractText(row, config.selectors.company);
          const location = this.extractText(row, config.selectors.location);
          const applyLink = this.extractAttribute(row, config.selectors.applyLink, 'href');
          const postedDate = this.extractText(row, config.selectors.postedDate);
          const salary = this.extractText(row, config.selectors.salary);
          const tags = this.extractTags(row, config.selectors.tags);

          // Apply data transformers if available
          const transformedTitle = config.dataTransformers?.title ? config.dataTransformers.title(title) : title;
          const transformedCompany = config.dataTransformers?.company ? config.dataTransformers.company(company) : company;
          const transformedLocation = config.dataTransformers?.location ? config.dataTransformers.location(location) : location;
          const transformedApplyLink = config.dataTransformers?.applyLink ? config.dataTransformers.applyLink(applyLink) : applyLink;
          const transformedPostedDate = config.dataTransformers?.postedDate ? config.dataTransformers.postedDate(postedDate) : postedDate;
          const transformedSalary = config.dataTransformers?.salary ? config.dataTransformers.salary(salary) : salary;
          const transformedTags = config.dataTransformers?.tags ? config.dataTransformers.tags(tags) : tags;

          // Special handling for RemoteOK company name issue
          let finalCompany = transformedCompany;
          let finalTitle = transformedTitle;
          
          if (config.name === 'RemoteOK') {
            // If company looks like an abbreviation and title looks like a real company name, swap them
            if (transformedCompany.length <= 3 && transformedTitle.length > 3) {
              finalCompany = transformedTitle;
              finalTitle = transformedCompany;
            }
          }

          if (finalTitle && finalCompany) {
            jobs.push({
              title: finalTitle,
              company: finalCompany,
              location: transformedLocation,
              applyLink: transformedApplyLink,
              postedDate: transformedPostedDate,
              salary: transformedSalary,
              tags: transformedTags
            });
          }
        } catch (error) {
          console.warn(`Error parsing job row ${index}:`, error);
        }
      });

      return jobs;
    }, this.config);
  }

  private extractText(element: Element, selectors: string[]): string {
    for (const selector of selectors) {
      const el = element.querySelector(selector);
      if (el && el.textContent?.trim()) {
        return el.textContent.trim();
      }
    }
    return '';
  }

  private extractAttribute(element: Element, selectors: string[], attribute: string): string {
    for (const selector of selectors) {
      const el = element.querySelector(selector);
      if (el && el.getAttribute(attribute)) {
        return el.getAttribute(attribute) || '';
      }
    }
    return '';
  }

  private extractTags(element: Element, selectors: string[]): string[] {
    for (const selector of selectors) {
      const elements = element.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter((text): text is string => Boolean(text));
      }
    }
    return [];
  }

  private async checkForNextPage(): Promise<boolean> {
    if (!this.page) return false;

    return await this.page.evaluate((selectors) => {
      for (const selector of selectors.nextPage) {
        const nextButton = document.querySelector(selector);
        if (nextButton) return true;
      }
      return false;
    }, this.config.selectors);
  }

  private buildPageUrl(page: number): string {
    // Handle different URL patterns for pagination
    if (this.config.name === 'RemoteOK') {
      return `${this.config.jobListUrl}?page=${page}`;
    }
    // Add more patterns for other sites
    return this.config.jobListUrl;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🔒 Browser closed');
    }
  }
}

// Factory function to create scrapers
export function createScraper(scraperName: string): DynamicScraper {
  return new DynamicScraper(scraperName);
}

// Main execution function
export async function scrapeJobs(scraperName: string, options?: DynamicScrapingOptions): Promise<JobListing[]> {
  const scraper = createScraper(scraperName);
  
  try {
    await scraper.initialize();
    const jobs = await scraper.scrapeJobs(options);
    return jobs;
  } finally {
    await scraper.close();
  }
} 