export const RelocateV1Selectors = {
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
  remote: '.job-card__remote',
  onsite: '.job-card__onsite',

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
  fullTime: '.job-card__full-time',
  partTime: '.job-card__part-time',
  contract: '.job-card__contract',

  // Relocation specific
  visaSponsorship: '.job-card__visa-sponsorship',
  relocationPackage: '.job-card__relocation-package',
  englishSpeaking: '.job-card__english-speaking',

  // Country and region
  country: '.job-card__country',
  region: '.job-card__region',
} as const;

export type RelocateV1Selector =
  (typeof RelocateV1Selectors)[keyof typeof RelocateV1Selectors];
