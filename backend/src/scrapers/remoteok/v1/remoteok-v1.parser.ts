import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../../base/interfaces';
import { RemoteOKV1Selectors } from './remoteok-v1.selectors';
import { JSDOM } from 'jsdom';
import { parseFlexibleDate } from '../../../common/utils/date.util';

@Injectable()
export class RemoteOKV1Parser {
  private readonly logger = new Logger(RemoteOKV1Parser.name);

  parseJobs(html: string): Job[] {
    try {
      const jobs: Job[] = [];

      // Parse HTML with jsdom
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Find job cards using selectors
      const jobCards = document.querySelectorAll(RemoteOKV1Selectors.jobCards);

      this.logger.debug(`Found ${jobCards.length} job cards`);

      jobCards.forEach((card) => {
        const job = this.parseJobCard(card);
        if (job) jobs.push(job);
      });

      return jobs;
    } catch (error) {
      this.logger.error('Failed to parse RemoteOK v1 HTML:', error);
      return [];
    }
  }

  parseJobCard(card: any): Job | null {
    try {
      const title = this.extractText(card, RemoteOKV1Selectors.title);
      const company = this.extractText(card, RemoteOKV1Selectors.company);
      const location = this.extractText(card, RemoteOKV1Selectors.location);
      const applyLink = this.extractAttribute(
        card,
        RemoteOKV1Selectors.applyLink,
        'href',
      );
      const postedDate = parseFlexibleDate(
        this.extractText(card, RemoteOKV1Selectors.postedDate),
      );
      const salary = this.extractText(card, RemoteOKV1Selectors.salary);
      const tags = this.extractTags(card);

      if (!title || !company) {
        this.logger.warn('Missing required fields for job card');
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
        source: 'RemoteOK',
        sourceId: this.generateSourceId(title, company),
      };
    } catch (error) {
      this.logger.error('Failed to parse job card:', error);
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
      const tagElements = card.querySelectorAll(RemoteOKV1Selectors.tags);
      return Array.from(tagElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.warn('Failed to extract tags:', error);
      return [];
    }
  }



  private normalizeUrl(url: string): string {
    if (!url) return '';

    // Ensure URL is absolute
    if (url.startsWith('/')) {
      return `https://remoteok.com${url}`;
    }

    if (!url.startsWith('http')) {
      return `https://${url}`;
    }

    return url;
  }

  private generateSourceId(title: string, company: string): string {
    // Create a unique ID based on title and company
    const base = `${title}-${company}`.toLowerCase();
    return base.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  hasNextPage(html: string): boolean {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const nextLink = document.querySelector(RemoteOKV1Selectors.nextPage);
      return !!nextLink;
    } catch (error) {
      this.logger.warn('Failed to check for next page:', error);
      return false;
    }
  }

  getCurrentPage(html: string): number {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const currentPage = document.querySelector(
        RemoteOKV1Selectors.currentPage,
      );
      return parseInt(currentPage?.textContent || '1');
    } catch (error) {
      this.logger.warn('Failed to get current page:', error);
      return 1;
    }
  }
}
