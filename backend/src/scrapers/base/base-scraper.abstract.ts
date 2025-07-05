import { Injectable, Logger } from '@nestjs/common';
import { IScraper, RateLimitConfig, ScrapingOptions, Job, ScrapingMetrics } from './interfaces';
import { RateLimiter } from './rate-limiter';
import { SessionManager } from './session-manager';
import { JSDOM } from 'jsdom';

@Injectable()
export abstract class BaseScraper implements IScraper {
  protected readonly logger = new Logger(this.constructor.name);
  protected rateLimiter: RateLimiter;
  protected sessionManager: SessionManager;
  protected metrics: ScrapingMetrics;

  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly baseUrl: string;

  constructor() {
    this.sessionManager = new SessionManager();
    this.rateLimiter = new RateLimiter(this.getRateLimit());
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastScraped: new Date(),
      version: 'unknown', // Will be set by concrete class
    };
  }

  abstract scrapeJobs(options?: ScrapingOptions): Promise<Job[]>;
  abstract getRateLimit(): RateLimitConfig;

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest(this.baseUrl);
      return response.ok;
    } catch (error) {
      this.logger.error(`Health check failed for ${this.name}:`, error);
      return false;
    }
  }

  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    return this.rateLimiter.add(async () => {
      const startTime = Date.now();
      
      try {
        const response = await this.sessionManager.makeRequest(url, options);
        this.recordRequest(Date.now() - startTime, true);
        return response;
      } catch (error) {
        this.recordRequest(Date.now() - startTime, false);
        throw error;
      }
    });
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }

  protected async parseHtml(html: string): Promise<Document> {
    const dom = new JSDOM(html);
    return dom.window.document;
  }

  protected extractText(element: any, selector: string): string {
    const found = element.querySelector(selector);
    return found?.textContent?.trim() || '';
  }

  protected extractAttribute(element: any, selector: string, attribute: string): string {
    const found = element.querySelector(selector);
    return found?.getAttribute(attribute) || '';
  }

  protected extractElements(element: any, selector: string): any[] {
    const elements = element.querySelectorAll(selector);
    return Array.from(elements);
  }

  protected normalizeJob(job: Partial<Job>): Job {
    return {
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      applyLink: job.applyLink || '',
      postedDate: job.postedDate || new Date(),
      salary: job.salary,
      tags: job.tags || [],
      status: 'ACTIVE',
      applied: false,
      dateScraped: new Date(),
      lastUpdated: new Date(),
      searchText: `${job.title} ${job.company} ${job.location}`.toLowerCase(),
      source: this.name,
      sourceId: job.sourceId,
      ...job,
    };
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordRequest(duration: number, success: boolean) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
    
    this.metrics.lastScraped = new Date();
  }

  getMetrics(): ScrapingMetrics {
    return { ...this.metrics };
  }

  getRateLimiterMetrics() {
    return this.rateLimiter.getMetrics();
  }

  getSessionInfo() {
    return this.sessionManager.getSessionInfo();
  }
} 