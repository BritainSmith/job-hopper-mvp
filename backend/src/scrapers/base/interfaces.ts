export interface IScraper {
  readonly name: string;
  readonly version: string;
  readonly baseUrl: string;
  
  scrapeJobs(options?: ScrapingOptions): Promise<Job[]>;
  isHealthy(): Promise<boolean>;
  getRateLimit(): RateLimitConfig;
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