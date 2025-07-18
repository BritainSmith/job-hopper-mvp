import { registerAs } from '@nestjs/config';

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  jobListUrl: string;
  selectors: {
    jobContainer: string[];
    title: string[];
    company: string[];
    location: string[];
    applyLink: string[];
    postedDate: string[];
    salary: string[];
    tags: string[];
    nextPage: string[];
  };
  options: {
    delay: number;
    maxPages: number;
    headless: boolean;
    userAgent?: string;
  };
  dataTransformers?: {
    title?: (text: string) => string;
    company?: (text: string) => string;
    location?: (text: string) => string;
    applyLink?: (url: string) => string;
    postedDate?: (text: string) => string;
    salary?: (text: string) => string;
    tags?: (tags: string[]) => string[];
  };
}

export const scrapersConfig = registerAs('scrapers', () => ({
  remoteok: {
    name: 'RemoteOK',
    baseUrl: 'https://remoteok.com',
    jobListUrl: 'https://remoteok.com/remote-dev-jobs',
    selectors: {
      jobContainer: [
        'tr.job',
        'tr[data-href]',
        '.job',
        '[data-job]',
        'tbody tr',
      ],
      title: ['h2 a', 'h3 a', '.job-title a', 'a[href*="/remote-jobs/"]'],
      company: [
        'h3 a',
        '.company a',
        '[data-company]',
        'td:nth-child(2) a',
        'td:nth-child(3) a',
      ],
      location: ['td.location', '.location', '[data-location]'],
      applyLink: ['h2 a', 'h3 a', '.job-title a', 'a[href*="/remote-jobs/"]'],
      postedDate: ['td.time', '.time', '[data-time]'],
      salary: ['td.salary', '.salary', '[data-salary]'],
      tags: ['td.tags a', '.tags a', '[data-tags] a'],
      nextPage: ['a[rel="next"]', '.next', '.pagination .next'],
    },
    options: {
      delay: 2000,
      maxPages: 5,
      headless: true,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    dataTransformers: {
      company: (text: string) => {
        if (text.length <= 3) {
          return text;
        }
        return text;
      },
      applyLink: (url: string) => {
        return url.startsWith('http') ? url : `https://remoteok.com${url}`;
      },
      location: (text: string) => {
        return text || 'Remote';
      },
    },
  },

  linkedin: {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com',
    jobListUrl:
      'https://www.linkedin.com/jobs/search/?keywords=software%20developer&location=Remote',
    selectors: {
      jobContainer: [
        '.job-search-card',
        '.job-card-container',
        '[data-job-id]',
      ],
      title: ['.job-search-card__title', '.job-card-list__title', 'h3 a'],
      company: [
        '.job-search-card__subtitle',
        '.job-card-container__company-name',
        '.job-card-container__primary-description',
      ],
      location: [
        '.job-search-card__location',
        '.job-card-container__metadata-item',
      ],
      applyLink: ['.job-search-card__title', 'h3 a'],
      postedDate: [
        '.job-search-card__listdate',
        '.job-card-container__metadata-item',
      ],
      salary: ['.job-search-card__salary', '.job-card-container__salary'],
      tags: ['.job-search-card__skills', '.job-card-container__skills'],
      nextPage: ['.artdeco-pagination__button--next', '.pagination__next'],
    },
    options: {
      delay: 3000,
      maxPages: 3,
      headless: true,
    },
    dataTransformers: {
      applyLink: (url: string) => {
        return url.startsWith('http') ? url : `https://www.linkedin.com${url}`;
      },
    },
  },

  indeed: {
    name: 'Indeed',
    baseUrl: 'https://www.indeed.com',
    jobListUrl: 'https://www.indeed.com/jobs?q=software+developer&l=Remote',
    selectors: {
      jobContainer: [
        '.job_seen_beacon',
        '.jobsearch-ResultsList li',
        '[data-jk]',
      ],
      title: ['.jobTitle', 'h2 a', '.jobTitle a'],
      company: ['.companyName', '.company', '.companyLocation .companyName'],
      location: ['.companyLocation', '.location', '.jobLocation'],
      applyLink: ['.jobTitle a', 'h2 a'],
      postedDate: ['.date', '.jobsearch-JobMetadataFooter'],
      salary: ['.salary-snippet', '.jobsearch-JobMetadataHeader-item'],
      tags: [
        '.jobsearch-JobMetadataHeader-item',
        '.jobsearch-JobDescriptionSection-sectionItem',
      ],
      nextPage: ['.np', '.pagination-list a[aria-label="Next"]'],
    },
    options: {
      delay: 2500,
      maxPages: 3,
      headless: true,
    },
    dataTransformers: {
      applyLink: (url: string) => {
        return url.startsWith('http') ? url : `https://www.indeed.com${url}`;
      },
    },
  },
}));
