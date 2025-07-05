import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../../base/interfaces';
import { LinkedInV1Selectors } from './linkedin-v1.selectors';
import { JSDOM } from 'jsdom';

@Injectable()
export class LinkedInV1Parser {
  private readonly logger = new Logger(LinkedInV1Parser.name);

  parseJobs(html: string): Job[] {
    try {
      const jobs: Job[] = [];
      
      // Parse HTML with jsdom
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Find job cards using selectors
      const jobCards = document.querySelectorAll(LinkedInV1Selectors.jobCards);
      
      this.logger.debug(`Found ${jobCards.length} job cards`);
      
      jobCards.forEach(card => {
        const job = this.parseJobCard(card);
        if (job) jobs.push(job);
      });
      
      return jobs;
    } catch (error) {
      this.logger.error('Failed to parse LinkedIn v1 HTML:', error);
      return [];
    }
  }

  parseJobCard(card: any): Job | null {
    try {
      const title = this.extractText(card, LinkedInV1Selectors.title);
      const company = this.extractText(card, LinkedInV1Selectors.company);
      const location = this.extractText(card, LinkedInV1Selectors.location);
      const applyLink = this.extractAttribute(card, LinkedInV1Selectors.applyLink, 'href');
      const postedDate = this.parseDate(this.extractText(card, LinkedInV1Selectors.postedDate));
      const salary = this.extractText(card, LinkedInV1Selectors.salary);
      const tags = this.extractTags(card);

      if (!title || !company) {
        this.logger.warn('Missing required fields for LinkedIn job card');
        return null;
      }

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Remote',
        applyLink: this.normalizeUrl(applyLink),
        postedDate,
        salary: salary?.trim(),
        tags: tags,
        status: 'ACTIVE',
        applied: false,
        dateScraped: new Date(),
        lastUpdated: new Date(),
        searchText: `${title} ${company} ${location}`.toLowerCase(),
        source: 'LinkedIn',
        sourceId: this.generateSourceId(title, company),
      };
    } catch (error) {
      this.logger.error('Failed to parse LinkedIn job card:', error);
      return null;
    }
  }

  private extractText(element: any, selector: string): string {
    const found = element.querySelector(selector);
    return found?.textContent?.trim() || '';
  }

  private extractAttribute(element: any, selector: string, attribute: string): string {
    const found = element.querySelector(selector);
    return found?.getAttribute(attribute) || '';
  }

  private extractTags(card: any): string[] {
    try {
      const tagElements = card.querySelectorAll(LinkedInV1Selectors.tags);
      return Array.from(tagElements).map((el: any) => el.textContent?.trim()).filter(Boolean);
    } catch (error) {
      this.logger.warn('Failed to extract LinkedIn tags:', error);
      return [];
    }
  }

  private parseDate(dateString: string): Date {
    try {
      if (!dateString) return new Date();
      
      // Try parsing common formats
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      // Handle relative dates like "2 days ago"
      if (dateString.includes('ago')) {
        return this.parseRelativeDate(dateString);
      }
      
      return new Date();
    } catch (error) {
      this.logger.warn('Failed to parse LinkedIn date:', dateString, error);
      return new Date();
    }
  }

  private parseRelativeDate(relativeDate: string): Date {
    const now = new Date();
    const match = relativeDate.match(/(\d+)\s+(day|days|hour|hours|minute|minutes|second|seconds)\s+ago/);
    
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

  private normalizeUrl(url: string): string {
    if (!url) return '';
    
    // Ensure URL is absolute
    if (url.startsWith('/')) {
      return `https://linkedin.com${url}`;
    }
    
    if (!url.startsWith('http')) {
      return `https://${url}`;
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
      const nextLink = document.querySelector(LinkedInV1Selectors.nextPage);
      return !!nextLink;
    } catch (error) {
      this.logger.warn('Failed to check for LinkedIn next page:', error);
      return false;
    }
  }

  getCurrentPage(html: string): number {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const currentPage = document.querySelector(LinkedInV1Selectors.currentPage);
      return parseInt(currentPage?.textContent || '1');
    } catch (error) {
      this.logger.warn('Failed to get LinkedIn current page:', error);
      return 1;
    }
  }
} 