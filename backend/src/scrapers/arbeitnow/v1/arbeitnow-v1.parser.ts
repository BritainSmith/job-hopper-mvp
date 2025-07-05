import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../../base/interfaces';
import { ArbeitnowV1Selectors } from './arbeitnow-v1.selectors';
import { JSDOM } from 'jsdom';

@Injectable()
export class ArbeitnowV1Parser {
  private readonly logger = new Logger(ArbeitnowV1Parser.name);

  parseJobs(html: string): Job[] {
    try {
      const jobs: Job[] = [];

      // Parse HTML with jsdom
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Find job cards using selectors
      const jobCards = document.querySelectorAll(ArbeitnowV1Selectors.jobCards);

      this.logger.debug(`Found ${jobCards.length} job cards`);

      jobCards.forEach((card) => {
        const job = this.parseJobCard(card);
        if (job) jobs.push(job);
      });

      return jobs;
    } catch (error) {
      this.logger.error('Failed to parse Arbeitnow v1 HTML:', error);
      return [];
    }
  }

  parseJobCard(card: any): Job | null {
    try {
      const title = this.extractText(card, ArbeitnowV1Selectors.title);
      const company = this.extractText(card, ArbeitnowV1Selectors.company);
      const location = this.extractText(card, ArbeitnowV1Selectors.location);
      const applyLink = this.extractAttribute(
        card,
        ArbeitnowV1Selectors.applyLink,
        'href',
      );
      const postedDate = this.parseDate(
        this.extractText(card, ArbeitnowV1Selectors.postedDate),
      );
      const salary = this.extractText(card, ArbeitnowV1Selectors.salary);
      const tags = this.extractTags(card);
      const benefits = this.extractBenefits(card);
      const jobType = this.extractJobType(card);

      if (!title || !company) {
        this.logger.warn('Missing required fields for Arbeitnow job card');
        return null;
      }

      // Combine tags and benefits
      const allTags = [...tags, ...benefits, jobType].filter(Boolean);

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Germany',
        applyLink: this.normalizeUrl(applyLink),
        postedDate,
        salary: salary?.trim(),
        tags: allTags,
        status: 'ACTIVE',
        applied: false,
        dateScraped: new Date(),
        lastUpdated: new Date(),
        searchText: `${title} ${company} ${location}`.toLowerCase(),
        source: 'Arbeitnow',
        sourceId: this.generateSourceId(title, company),
      };
    } catch (error) {
      this.logger.error('Failed to parse Arbeitnow job card:', error);
      return null;
    }
  }

  private extractText(element: any, selector: string): string {
    const found = element.querySelector(selector);
    return found?.textContent?.trim() || '';
  }

  private extractAttribute(
    element: any,
    selector: string,
    attribute: string,
  ): string {
    const found = element.querySelector(selector);
    return found?.getAttribute(attribute) || '';
  }

  private extractTags(card: any): string[] {
    try {
      const tagElements = card.querySelectorAll(ArbeitnowV1Selectors.tags);
      return Array.from(tagElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.warn('Failed to extract Arbeitnow tags:', error);
      return [];
    }
  }

  private extractBenefits(card: any): string[] {
    try {
      const benefitElements = card.querySelectorAll(
        ArbeitnowV1Selectors.benefits,
      );
      const perkElements = card.querySelectorAll(ArbeitnowV1Selectors.perks);

      const benefits = Array.from(benefitElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);
      const perks = Array.from(perkElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);

      return [...benefits, ...perks];
    } catch (error) {
      this.logger.warn('Failed to extract Arbeitnow benefits:', error);
      return [];
    }
  }

  private extractJobType(card: any): string {
    try {
      // Check for job type indicators
      if (card.querySelector(ArbeitnowV1Selectors.remote)) {
        return 'Remote';
      }
      if (card.querySelector(ArbeitnowV1Selectors.fullTime)) {
        return 'Full-time';
      }
      if (card.querySelector(ArbeitnowV1Selectors.partTime)) {
        return 'Part-time';
      }
      if (card.querySelector(ArbeitnowV1Selectors.contract)) {
        return 'Contract';
      }

      // Check for visa sponsorship and relocation
      const hasVisaSponsorship = card.querySelector(
        ArbeitnowV1Selectors.visaSponsorship,
      );
      const hasRelocation = card.querySelector(ArbeitnowV1Selectors.relocation);

      if (hasVisaSponsorship) {
        return 'Visa Sponsorship';
      }
      if (hasRelocation) {
        return 'Relocation Package';
      }

      return '';
    } catch (error) {
      this.logger.warn('Failed to extract Arbeitnow job type:', error);
      return '';
    }
  }

  private parseDate(dateString: string): Date {
    try {
      if (!dateString) return new Date();

      // Handle German date formats FIRST (before default parsing)
      if (dateString.includes('.')) {
        const germanDate = this.parseGermanDate(dateString);
        if (germanDate) return germanDate;
      }

      // Handle relative dates like "2 days ago"
      if (dateString.includes('ago')) {
        return this.parseRelativeDate(dateString);
      }

      // Try parsing common formats (ISO, etc.)
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return new Date();
    } catch (error) {
      this.logger.warn('Failed to parse Arbeitnow date:', dateString, error);
      return new Date();
    }
  }

  private parseRelativeDate(relativeDate: string): Date {
    const now = new Date();
    const match = relativeDate.match(
      /(\d+)\s+(day|days|hour|hours|minute|minutes|second|seconds)\s+ago/,
    );

    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'day':
        case 'days':
          return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
        case 'hour':
        case 'hours':
          return new Date(now.getTime() - amount * 60 * 60 * 1000);
        case 'minute':
        case 'minutes':
          return new Date(now.getTime() - amount * 60 * 1000);
        case 'second':
        case 'seconds':
          return new Date(now.getTime() - amount * 1000);
      }
    }

    return now;
  }

  private parseGermanDate(dateString: string): Date | null {
    try {
      // Handle German date format: DD.MM.YYYY
      const match = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }

      // Handle German date format: DD.MM.YY
      const matchShort = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/);
      if (matchShort) {
        const [, day, month, year] = matchShort;
        const fullYear =
          parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        return new Date(Date.UTC(fullYear, parseInt(month) - 1, parseInt(day)));
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';

    // Ensure URL is absolute
    if (url.startsWith('/')) {
      return `https://www.arbeitnow.com${url}`;
    }

    if (!url.startsWith('http')) {
      return `https://www.arbeitnow.com/${url}`;
    }

    return url;
  }

  private generateSourceId(title: string, company: string): string {
    const base = `${title}-${company}`.toLowerCase();
    return base.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  hasNextPage(html: string): boolean {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const nextLink = document.querySelector(ArbeitnowV1Selectors.nextPage);
      return !!nextLink;
    } catch (error) {
      this.logger.warn('Failed to check for Arbeitnow next page:', error);
      return false;
    }
  }

  getCurrentPage(html: string): number {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const currentPage = document.querySelector(
        ArbeitnowV1Selectors.currentPage,
      );
      return parseInt(currentPage?.textContent || '1');
    } catch (error) {
      this.logger.warn('Failed to get Arbeitnow current page:', error);
      return 1;
    }
  }
}
