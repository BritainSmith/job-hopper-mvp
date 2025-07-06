export interface IScraper {
  readonly name: string;
  readonly version: string;
  readonly baseUrl: string;

  scrapeJobs(options?: ScrapingOptions): Promise<Job[]>;
  isHealthy(): Promise<boolean>;
  getRateLimit(): RateLimitConfig;
  getMetrics(): ScrapingMetrics;
}

export interface IJobParser {
  /**
   * Parse HTML content and extract job listings
   * @param html - Raw HTML string from the job board
   * @returns Array of parsed Job objects
   */
  parseJobs(html: string): Job[];

  /**
   * Parse a single job card element
   * @param card - DOM element representing a job card
   * @returns Parsed Job object or null if parsing fails
   */
  parseJobCard(card: Element): Job | null;

  /**
   * Check if there are more pages to scrape (optional)
   * @param html - Raw HTML string from the current page
   * @returns true if there are more pages, false otherwise
   */
  hasNextPage?(html: string): boolean;

  /**
   * Get the current page number (optional)
   * @param html - Raw HTML string from the current page
   * @returns Current page number, defaults to 1
   */
  getCurrentPage?(html: string): number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  delayBetweenRequests: { min: number; max: number };
  maxConcurrentRequests: number;
}

export interface ScrapingOptions {
  maxPages?: number;
  maxJobs?: number;
  filters?: JobFilters;
  forceRefresh?: boolean;
}

export interface JobFilters {
  location?: string;
  remote?: boolean;
  salary?: { min?: number; max?: number };
  tags?: string[];
  company?: string;
}

export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  applyLink: string;
  postedDate: Date;
  salary?: string;
  tags: string[];
  status: 'ACTIVE' | 'INACTIVE';
  applied: boolean;
  dateScraped: Date;
  lastUpdated: Date;
  searchText: string;
  source: string;
  sourceId?: string;
}

export interface ScrapingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastScraped: Date;
  version: string;
}

export interface ScraperConfig {
  enabled: boolean;
  rateLimit: RateLimitConfig;
  retryAttempts: number;
  timeout: number;
  userAgents: string[];
  proxies?: string[];
}
