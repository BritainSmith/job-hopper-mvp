export const ArbeitnowV1Selectors = {
  // Main job listing container
  jobCards: '.job-card',

  // Job details
  title: '.job-card__title',
  company: '.job-card__company',
  location: '.job-card__location',
  applyLink: '.job-card__title a',
  postedDate: '.job-card__date',
  salary: '.job-card__salary',
  tags: '.job-card__tags .tag',

  // Pagination
  nextPage: '.pagination__next',
  currentPage: '.pagination__current',

  // Job card wrapper
  jobCardWrapper: '.job-card',

  // Additional details
  description: '.job-card__description',
  requirements: '.job-card__requirements',

  // Status indicators
  featured: '.job-card--featured',
  new: '.job-card--new',
  visaSponsorship: '.job-card__visa-sponsorship',
  relocation: '.job-card__relocation',

  // Company details
  companyLogo: '.job-card__company-logo img',
  companySize: '.job-card__company-size',

  // Application details
  applicationType: '.job-card__application-type',
  applicationDeadline: '.job-card__deadline',

  // Benefits and perks
  benefits: '.job-card__benefits .benefit',
  perks: '.job-card__perks .perk',

  // Job type indicators
  remote: '.job-card__remote',
  fullTime: '.job-card__full-time',
  partTime: '.job-card__part-time',
  contract: '.job-card__contract',
} as const;

export type ArbeitnowV1Selector =
  (typeof ArbeitnowV1Selectors)[keyof typeof ArbeitnowV1Selectors];
