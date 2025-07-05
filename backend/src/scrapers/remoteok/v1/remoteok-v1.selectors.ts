export const RemoteOKV1Selectors = {
  // Main job listing container - RemoteOK uses table rows
  jobCards: 'tr.job',
  
  // Job details - these are likely in table cells
  title: 'td.company_and_position h2',
  company: 'td.company_and_position h3',
  location: 'td.location',
  applyLink: 'td.source a',
  postedDate: 'td.date',
  salary: 'td.salary',
  tags: 'td.tags span',
  
  // Pagination
  nextPage: '.pagination .next a',
  currentPage: '.pagination .current',
  
  // Job card wrapper
  jobCardWrapper: 'tr.job',
  
  // Additional details
  description: 'td.description',
  requirements: 'td.requirements',
  
  // Status indicators
  featured: 'tr.job.featured',
  new: 'tr.job.new',
  
  // Company details
  companyLogo: 'td.company_and_position img',
  companySize: 'td.company-size',
  
  // Application details
  applicationType: 'td.application-type',
  applicationDeadline: 'td.deadline',
} as const;

export type RemoteOKV1Selector = typeof RemoteOKV1Selectors[keyof typeof RemoteOKV1Selectors]; 