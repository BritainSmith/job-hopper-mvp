import { Injectable, Logger } from '@nestjs/common';
import { Job as PrismaJob } from '@prisma/client';
import { IDataCleaningService } from '../interfaces/data-cleaning.service.interface';

// Currency transformer utility
interface CurrencyMapping {
  symbols: string[];
  codes: string[];
  aliases: string[];
  normalizedCode: string;
}

const CURRENCY_MAPPINGS: CurrencyMapping[] = [
  {
    symbols: ['$'],
    codes: ['USD', 'US$', 'US DOLLAR', 'US DOLLARS'],
    aliases: ['dollar', 'dollars', 'usd'],
    normalizedCode: 'USD',
  },
  {
    symbols: ['€'],
    codes: ['EUR', 'EURO', 'EUROS'],
    aliases: ['euro', 'euros', 'eur'],
    normalizedCode: 'EUR',
  },
  {
    symbols: ['£'],
    codes: ['GBP', 'POUND', 'POUNDS', 'STERLING'],
    aliases: ['pound', 'pounds', 'sterling', 'gbp'],
    normalizedCode: 'GBP',
  },
  {
    symbols: ['¥'],
    codes: ['JPY', 'YEN', 'YENS'],
    aliases: ['yen', 'yens', 'jpy'],
    normalizedCode: 'JPY',
  },
  {
    symbols: ['₹'],
    codes: ['INR', 'RUPEE', 'RUPEES'],
    aliases: ['rupee', 'rupees', 'inr'],
    normalizedCode: 'INR',
  },
];

function extractCurrency(text: string): string {
  if (!text) return 'USD'; // Default to USD

  const normalizedText = text.toUpperCase().trim();

  // First, check for currency symbols
  for (const mapping of CURRENCY_MAPPINGS) {
    for (const symbol of mapping.symbols) {
      if (normalizedText.includes(symbol)) {
        return mapping.normalizedCode;
      }
    }
  }

  // Then, check for currency codes
  for (const mapping of CURRENCY_MAPPINGS) {
    for (const code of mapping.codes) {
      if (normalizedText.includes(code)) {
        return mapping.normalizedCode;
      }
    }
  }

  // Finally, check for aliases
  for (const mapping of CURRENCY_MAPPINGS) {
    for (const alias of mapping.aliases) {
      if (normalizedText.includes(alias.toUpperCase())) {
        return mapping.normalizedCode;
      }
    }
  }

  return 'USD'; // Default fallback
}

export interface CleanedJobData {
  id: number;
  title: string;
  company: string;
  location: string;
  applyLink: string;
  postedDate?: string | null;
  salary?: string | null;
  tags?: string | null;
  source: string;
  dateScraped: Date;
  lastUpdated: Date;
  // AI-ready fields
  normalizedTitle: string;
  normalizedCompany: string;
  normalizedLocation: string;
  extractedSkills: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string; // Currency code (e.g., 'USD', 'EUR', 'GBP')
  } | null;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  searchText: string;
  qualityScore: number;
}

export interface DataQualityMetrics {
  totalJobs: number;
  jobsWithCompleteData: number;
  jobsWithSalary: number;
  jobsWithSkills: number;
  averageQualityScore: number;
  commonIssues: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
}

@Injectable()
export class DataCleaningService implements IDataCleaningService {
  private readonly logger = new Logger(DataCleaningService.name);

  /**
   * Clean and normalize job data for AI processing
   */
  cleanJobData(job: PrismaJob): CleanedJobData {
    const cleaned: CleanedJobData = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      applyLink: job.applyLink,
      postedDate: job.postedDate,
      salary: job.salary,
      tags: job.tags,
      source: job.source,
      dateScraped: job.dateScraped,
      lastUpdated: job.lastUpdated,

      // AI-ready normalized fields
      normalizedTitle: this.normalizeTitle(job.title),
      normalizedCompany: this.normalizeCompany(job.company),
      normalizedLocation: this.normalizeLocation(job.location),
      extractedSkills: this.extractSkills(job.tags || '', job.title),
      salaryRange: this.parseSalary(job.salary),
      experienceLevel: this.extractExperienceLevel(job.title, job.tags || ''),
      jobType: this.extractJobType(job.title, job.tags || ''),
      remoteType: this.extractRemoteType(
        job.title,
        job.location,
        job.tags || '',
      ),
      searchText: this.generateSearchText(job),
      qualityScore: this.calculateQualityScore(job),
    };

    return cleaned;
  }

  /**
   * Normalize job title for better matching
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\b(jr|jr\.|junior|sr|sr\.|senior|lead|principal|staff)\b/g, '') // Remove level indicators
      .trim();
  }

  /**
   * Normalize company name
   */
  private normalizeCompany(company: string): string {
    return company
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '')
      .replace(/\b(inc|corp|llc|ltd|company|co)\b/g, '') // Remove common suffixes
      .trim();
  }

  /**
   * Normalize location
   */
  private normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,-]/g, '')
      .replace(/\b(remote|worldwide|anywhere|global)\b/g, 'remote')
      .trim();
  }

  /**
   * Extract skills from tags and title
   */
  private extractSkills(tags: string, title: string): string[] {
    const skills = new Set<string>();

    // Extract from tags
    if (tags) {
      const tagSkills = tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);
      tagSkills.forEach((skill) => skills.add(skill));
    }

    // Extract common tech skills from title
    const techSkills = [
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'c++',
      'go',
      'rust',
      'react',
      'angular',
      'vue',
      'node.js',
      'express',
      'django',
      'spring',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'terraform',
      'postgresql',
      'mysql',
      'mongodb',
      'redis',
      'elasticsearch',
      'machine learning',
      'ai',
      'data science',
      'devops',
      'frontend',
      'backend',
    ];

    const titleLower = title.toLowerCase();
    techSkills.forEach((skill) => {
      if (titleLower.includes(skill)) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  /**
   * Parse salary information
   */
  private parseSalary(
    salary?: string | null,
  ): { min: number; max: number; currency: string } | null {
    if (!salary) return null;

    try {
      // Remove common words and normalize
      const normalized = salary
        .toLowerCase()
        .replace(/[^\d\s\-–—,.]/g, '')
        .trim();

      // Extract numbers
      const matchResult = normalized.match(/\d+(?:,\d+)*(?:\.\d+)?/g);
      if (!matchResult) return null;

      // Convert to numbers and filter out NaN values
      const values: number[] = [];
      for (const num of matchResult) {
        const parsed = parseFloat(num.replace(/,/g, ''));
        if (!Number.isNaN(parsed)) {
          values.push(parsed);
        }
      }

      if (values.length === 0) return null;

      // Determine currency from original text using the currency transformer
      const currency = extractCurrency(salary);

      if (values.length === 1) {
        return { min: values[0], max: values[0], currency };
      } else {
        // Find min and max values
        let min = values[0];
        let max = values[0];
        for (let i = 1; i < values.length; i++) {
          if (values[i] < min) min = values[i];
          if (values[i] > max) max = values[i];
        }
        return { min, max, currency };
      }
    } catch (error) {
      this.logger.warn('Failed to parse salary:', {
        salary,
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Extract experience level from title and tags
   */
  private extractExperienceLevel(
    title: string,
    tags: string,
  ): 'entry' | 'mid' | 'senior' | 'lead' | 'unknown' {
    const text = `${title} ${tags}`.toLowerCase();

    if (
      text.includes('senior') ||
      text.includes('lead') ||
      text.includes('principal') ||
      text.includes('staff')
    ) {
      return 'senior';
    }
    if (text.includes('mid') || text.includes('intermediate')) {
      return 'mid';
    }
    if (
      text.includes('entry') ||
      text.includes('junior') ||
      text.includes('jr')
    ) {
      return 'entry';
    }
    if (text.includes('lead') || text.includes('manager')) {
      return 'lead';
    }

    return 'unknown';
  }

  /**
   * Extract job type from title and tags
   */
  private extractJobType(
    title: string,
    tags: string,
  ): 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown' {
    const text = `${title} ${tags}`.toLowerCase();

    if (text.includes('contract') || text.includes('freelance')) {
      return 'contract';
    }
    if (text.includes('part-time') || text.includes('part time')) {
      return 'part-time';
    }
    if (text.includes('intern') || text.includes('internship')) {
      return 'internship';
    }
    if (text.includes('full-time') || text.includes('full time')) {
      return 'full-time';
    }

    return 'unknown';
  }

  /**
   * Extract remote type from title, location, and tags
   */
  private extractRemoteType(
    title: string,
    location: string,
    tags: string,
  ): 'remote' | 'hybrid' | 'onsite' | 'unknown' {
    const text = `${title} ${location} ${tags}`.toLowerCase();

    if (
      text.includes('remote') ||
      text.includes('work from home') ||
      text.includes('wfh')
    ) {
      return 'remote';
    }
    if (text.includes('hybrid') || text.includes('partially remote')) {
      return 'hybrid';
    }
    if (
      text.includes('onsite') ||
      text.includes('on-site') ||
      text.includes('in-office')
    ) {
      return 'onsite';
    }

    return 'unknown';
  }

  /**
   * Generate searchable text for the job
   */
  private generateSearchText(job: PrismaJob): string {
    const parts = [
      job.title,
      job.company,
      job.location,
      job.tags,
      job.salary,
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  /**
   * Calculate quality score for the job data
   */
  private calculateQualityScore(job: PrismaJob): number {
    let score = 0;
    const maxScore = 100;

    // Required fields (40 points)
    if (job.title) score += 10;
    if (job.company) score += 10;
    if (job.location) score += 10;
    if (job.applyLink) score += 10;

    // Optional but valuable fields (60 points)
    if (job.postedDate) score += 15;
    if (job.salary) score += 15;
    if (job.tags) score += 15;
    if (job.searchText) score += 15;

    return Math.min(score, maxScore);
  }

  /**
   * Get data quality metrics for all jobs
   */
  async getDataQualityMetrics(jobs: PrismaJob[]): Promise<DataQualityMetrics> {
    await Promise.resolve(); // Ensure async operation
    const totalJobs = jobs.length;
    let jobsWithCompleteData = 0;
    let jobsWithSalary = 0;
    let jobsWithSkills = 0;
    let totalQualityScore = 0;

    const issues = new Map<string, number>();

    for (const job of jobs) {
      // Check completeness
      if (job.title && job.company && job.location && job.applyLink) {
        jobsWithCompleteData++;
      } else {
        const missingFields: string[] = [];
        if (!job.title) missingFields.push('title');
        if (!job.company) missingFields.push('company');
        if (!job.location) missingFields.push('location');
        if (!job.applyLink) missingFields.push('applyLink');

        const issue = `Missing: ${missingFields.join(', ')}`;
        issues.set(issue, (issues.get(issue) || 0) + 1);
      }

      // Check salary
      if (job.salary) {
        jobsWithSalary++;
      } else {
        issues.set(
          'No salary information',
          (issues.get('No salary information') || 0) + 1,
        );
      }

      // Check skills
      if (job.tags) {
        jobsWithSkills++;
      } else {
        issues.set('No skills/tags', (issues.get('No skills/tags') || 0) + 1);
      }

      // Calculate quality score
      totalQualityScore += this.calculateQualityScore(job);
    }

    const averageQualityScore =
      totalJobs > 0 ? totalQualityScore / totalJobs : 0;

    const commonIssues = Array.from(issues.entries())
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: (count / totalJobs) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 issues

    return {
      totalJobs,
      jobsWithCompleteData,
      jobsWithSalary,
      jobsWithSkills,
      averageQualityScore,
      commonIssues,
    };
  }

  /**
   * Export cleaned data for AI processing
   */
  async exportCleanedData(jobs: PrismaJob[]): Promise<CleanedJobData[]> {
    await Promise.resolve(); // Ensure async operation
    this.logger.log(`Exporting cleaned data for ${jobs.length} jobs`);

    const cleanedJobs = jobs.map((job) => this.cleanJobData(job));

    this.logger.log(`Successfully cleaned ${cleanedJobs.length} jobs`);
    return cleanedJobs;
  }
}
