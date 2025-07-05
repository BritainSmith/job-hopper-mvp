// Export all services
export { jobService, JobService } from './jobService';
export { scraperService, ScraperService } from './scraperService';

// Export types
export type {
  JobSearchOptions,
  JobApplicationData,
  JobStats
} from './jobService';

export type {
  ScrapingResult,
  ScrapingOptions,
  AutomationOptions
} from './scraperService'; 