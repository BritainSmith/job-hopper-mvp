import puppeteer, { Browser, Page } from 'puppeteer';
import { scraperConfig } from '../config/env';

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

export class RemoteOKScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(private options: ScrapingOptions = {}) {
    this.options = {
      maxPages: scraperConfig.maxPages,
      delay: scraperConfig.delay,
      headless: scraperConfig.headless,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options
    };
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
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
      await this.page.setUserAgent(this.options.userAgent!);
      
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

      console.log('✅ Browser initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async scrapeJobs(): Promise<JobListing[]> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const allJobs: JobListing[] = [];
    let currentPage = 1;

    try {
      console.log('🚀 Starting to scrape RemoteOK for software developer jobs...');

      while (currentPage <= this.options.maxPages!) {
        console.log(`📄 Scraping page ${currentPage}...`);
        
        const url = currentPage === 1 
          ? 'https://remoteok.com/remote-dev-jobs'
          : `https://remoteok.com/remote-dev-jobs?page=${currentPage}`;

        await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for content to load
        await this.delay(3000);
        
        // Take a screenshot for debugging (only in development)
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SCREENSHOTS === 'true') {
          await this.page.screenshot({ path: `debug-page-${currentPage}.png` });
          console.log(`📸 Screenshot saved as debug-page-${currentPage}.png`);
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
        if (currentPage <= this.options.maxPages!) {
          console.log(`⏳ Waiting ${this.options.delay}ms before next page...`);
          await this.delay(this.options.delay!);
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

    return await this.page.evaluate(() => {
      const jobs: JobListing[] = [];
      
      // Try multiple selectors to find job listings
      const selectors = [
        'tr.job',
        'tr[data-href]',
        '.job',
        '[data-job]',
        'tr:has(td)',
        'tbody tr'
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
          const titleElement = row.querySelector('h2 a, h3 a, .job-title a, a[href*="/remote-jobs/"]');
          let title = titleElement?.textContent?.trim() || '';
          const applyLink = titleElement?.getAttribute('href') || '';
          const fullApplyLink = applyLink.startsWith('http') ? applyLink : `https://remoteok.com${applyLink}`;

          // Extract company name - look for company information in different positions
          const companySelectors = [
            'h3 a', 
            '.company a', 
            '[data-company]', 
            'td:nth-child(2) a',
            'td:nth-child(3) a',
            'td a:not([href*="/remote-jobs/"])'
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
          const locationElement = row.querySelector('td.location, .location, [data-location]');
          const location = locationElement?.textContent?.trim() || 'Remote';

          // Extract posted date
          const dateElement = row.querySelector('td.time, .time, [data-time]');
          const postedDate = dateElement?.textContent?.trim() || '';

          // Extract salary (if available)
          const salaryElement = row.querySelector('td.salary, .salary, [data-salary]');
          const salary = salaryElement?.textContent?.trim() || '';

          // Extract tags
          const tagElements = row.querySelectorAll('td.tags a, .tags a, [data-tags] a');
          const tags = Array.from(tagElements)
            .map(tag => tag.textContent?.trim())
            .filter((tag): tag is string => Boolean(tag));

          if (title && company) {
            jobs.push({
              title,
              company,
              location,
              applyLink: fullApplyLink,
              postedDate,
              salary: salary || undefined,
              tags: tags.length > 0 ? tags : undefined
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
      const nextButton = document.querySelector('a[rel="next"], .next, .pagination .next');
      return nextButton !== null;
    });
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

  // Utility method to save results to JSON file
  async saveToFile(jobs: JobListing[], filename: string = 'remoteok-jobs.json'): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const outputPath = path.join(process.cwd(), filename);
    await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2), 'utf8');
    console.log(`💾 Jobs saved to ${outputPath}`);
  }
}

// Main execution function
export async function scrapeRemoteOKJobs(options?: ScrapingOptions): Promise<JobListing[]> {
  const scraper = new RemoteOKScraper(options);
  
  try {
    await scraper.initialize();
    const jobs = await scraper.scrapeJobs();
    
    // Save results to file
    await scraper.saveToFile(jobs);
    
    return jobs;
  } finally {
    await scraper.close();
  }
}

// Example usage
if (require.main === module) {
  scrapeRemoteOKJobs({
    maxPages: 2,
    delay: 3000,
    headless: false // Set to true for production
  })
  .then(jobs => {
    console.log('\n📊 Scraping Summary:');
    console.log(`Total jobs found: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log('\n🏢 Companies found:');
      const companies = [...new Set(jobs.map(job => job.company))];
      companies.forEach(company => console.log(`- ${company}`));
      
      console.log('\n📋 Sample jobs:');
      jobs.slice(0, 3).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} at ${job.company}`);
      });
    }
  })
  .catch(error => {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  });
}
