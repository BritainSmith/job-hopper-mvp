export const LinkedInV1Selectors = {
  // Main job listing container
  jobCards: '.job-search-card',
  
  // Job details
  title: '.job-search-card__title',
  company: '.job-search-card__subtitle',
  location: '.job-search-card__location',
  applyLink: '.job-search-card__title-link',
  postedDate: '.job-search-card__listdate',
  salary: '.job-search-card__salary-info',
  tags: '.job-search-card__metadata-item',
  
  // Pagination
  nextPage: '.artdeco-pagination__button--next',
  currentPage: '.artdeco-pagination__indicator--active',
  
  // Job card wrapper
  jobCardWrapper: '.job-search-card',
  
  // Additional details
  description: '.job-search-card__snippet',
  requirements: '.job-search-card__criteria',
  
  // Status indicators
  featured: '.job-search-card--featured',
  new: '.job-search-card--new',
  
  // Company details
  companyLogo: '.job-search-card__company-logo img',
  companySize: '.job-search-card__company-size',
  
  // Application details
  applicationType: '.job-search-card__application-type',
  applicationDeadline: '.job-search-card__deadline',
} as const;

export type LinkedInV1Selector = typeof LinkedInV1Selectors[keyof typeof LinkedInV1Selectors]; 