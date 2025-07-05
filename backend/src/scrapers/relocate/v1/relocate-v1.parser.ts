import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../../base/interfaces';
import { RelocateV1Selectors } from './relocate-v1.selectors';
import { JSDOM } from 'jsdom';
import { parseFlexibleDate } from '../../../common/utils/date.util';

@Injectable()
export class RelocateV1Parser {
  private readonly logger = new Logger(RelocateV1Parser.name);

  parseJobs(html: string): Job[] {
    try {
      const jobs: Job[] = [];

      // Parse HTML with jsdom
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Find job cards using selectors
      const jobCards = document.querySelectorAll(RelocateV1Selectors.jobCards);

      this.logger.debug(`Found ${jobCards.length} job cards`);

      jobCards.forEach((card) => {
        const job = this.parseJobCard(card);
        if (job) jobs.push(job);
      });

      return jobs;
    } catch (error) {
      this.logger.error('Failed to parse Relocate.me v1 HTML:', error);
      return [];
    }
  }

  parseJobCard(card: any): Job | null {
    try {
      const title = this.extractText(card, RelocateV1Selectors.title);
      const company = this.extractText(card, RelocateV1Selectors.company);
      const location = this.extractText(card, RelocateV1Selectors.location);
      const country = this.extractText(card, RelocateV1Selectors.country);
      const region = this.extractText(card, RelocateV1Selectors.region);
      const applyLink = this.extractAttribute(
        card,
        RelocateV1Selectors.applyLink,
        'href',
      );
      const postedDate = parseFlexibleDate(
        this.extractText(card, RelocateV1Selectors.postedDate),
      );
      const salary = this.extractText(card, RelocateV1Selectors.salary);
      const tags = this.extractTags(card);
      const benefits = this.extractBenefits(card);
      const jobType = this.extractJobType(card);
      const relocationFeatures = this.extractRelocationFeatures(card);

      if (!title || !company) {
        this.logger.warn('Missing required fields for Relocate.me job card');
        return null;
      }

      // Combine location information
      const fullLocation = this.combineLocation(location, country, region);

      // Combine tags, benefits, job type, and relocation features
      const allTags = [
        ...tags,
        ...benefits,
        jobType,
        ...relocationFeatures,
      ].filter(Boolean);

      return {
        title: title.trim(),
        company: company.trim(),
        location: fullLocation,
        applyLink: this.normalizeUrl(applyLink),
        postedDate,
        salary: salary?.trim(),
        tags: allTags,
        status: 'ACTIVE',
        applied: false,
        dateScraped: new Date(),
        lastUpdated: new Date(),
        searchText: `${title} ${company} ${fullLocation}`.toLowerCase(),
        source: 'Relocate.me',
        sourceId: this.generateSourceId(title, company),
      };
    } catch (error) {
      this.logger.error('Failed to parse Relocate.me job card:', error);
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
      const tagElements = card.querySelectorAll(RelocateV1Selectors.tags);
      return Array.from(tagElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.warn('Failed to extract Relocate.me tags:', error);
      return [];
    }
  }

  private extractBenefits(card: any): string[] {
    try {
      const benefitElements = card.querySelectorAll(
        RelocateV1Selectors.benefits,
      );
      const perkElements = card.querySelectorAll(RelocateV1Selectors.perks);

      const benefits = Array.from(benefitElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);
      const perks = Array.from(perkElements)
        .map((el: any) => el.textContent?.trim())
        .filter(Boolean);

      return [...benefits, ...perks];
    } catch (error) {
      this.logger.warn('Failed to extract Relocate.me benefits:', error);
      return [];
    }
  }

  private extractJobType(card: any): string {
    try {
      // Check for job type indicators
      if (card.querySelector(RelocateV1Selectors.remote)) {
        return 'Remote';
      }
      if (card.querySelector(RelocateV1Selectors.onsite)) {
        return 'On-site';
      }
      if (card.querySelector(RelocateV1Selectors.fullTime)) {
        return 'Full-time';
      }
      if (card.querySelector(RelocateV1Selectors.partTime)) {
        return 'Part-time';
      }
      if (card.querySelector(RelocateV1Selectors.contract)) {
        return 'Contract';
      }

      return '';
    } catch (error) {
      this.logger.warn('Failed to extract Relocate.me job type:', error);
      return '';
    }
  }

  private extractRelocationFeatures(card: any): string[] {
    try {
      const features: string[] = [];

      // Check for relocation-specific features
      if (card.querySelector(RelocateV1Selectors.visaSponsorship)) {
        features.push('Visa Sponsorship');
      }
      if (card.querySelector(RelocateV1Selectors.relocationPackage)) {
        features.push('Relocation Package');
      }
      if (card.querySelector(RelocateV1Selectors.englishSpeaking)) {
        features.push('English Speaking');
      }

      return features;
    } catch (error) {
      this.logger.warn(
        'Failed to extract Relocate.me relocation features:',
        error,
      );
      return [];
    }
  }

  private combineLocation(
    location: string,
    country: string,
    region: string,
  ): string {
    const parts = [location, region, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'International';
  }



  private normalizeUrl(url: string): string {
    if (!url) return '';

    // Ensure URL is absolute
    if (url.startsWith('/')) {
      return `https://relocate.me${url}`;
    }

    if (!url.startsWith('http')) {
      return `https://relocate.me/${url}`;
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
      const nextLink = document.querySelector(RelocateV1Selectors.nextPage);
      return !!nextLink;
    } catch (error) {
      this.logger.warn('Failed to check for Relocate.me next page:', error);
      return false;
    }
  }

  getCurrentPage(html: string): number {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const currentPage = document.querySelector(
        RelocateV1Selectors.currentPage,
      );
      return parseInt(currentPage?.textContent || '1');
    } catch (error) {
      this.logger.warn('Failed to get Relocate.me current page:', error);
      return 1;
    }
  }
}
