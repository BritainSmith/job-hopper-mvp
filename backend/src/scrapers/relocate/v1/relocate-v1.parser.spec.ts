import { RelocateV1Parser } from './relocate-v1.parser';
import { RelocateV1Selectors } from './relocate-v1.selectors';
import { JSDOM } from 'jsdom';
import { parseFlexibleDate } from '../../../common/utils/date.util';

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
  Injectable: () => (target: unknown) => target,
}));

describe('RelocateV1Parser', () => {
  let parser: RelocateV1Parser;

  beforeEach(() => {
    parser = new RelocateV1Parser();
  });

  describe('parseJobs', () => {
    it('should parse jobs from valid HTML', () => {
      const html = `<div>
  <div class="job-card">
    <h2 class="job-card__title"><a href="/jobs/123">Frontend Dev</a></h2>
    <div class="job-card__company">Acme</div>
    <div class="job-card__location">Berlin</div>
    <div class="job-card__date">2024-01-01</div>
    <div class="job-card__salary">€50k</div>
    <span class="job-card__tags"><span class="tag">Remote</span></span>
    <span class="job-card__benefits"><span class="benefit">Visa</span></span>
    <span class="job-card__perks"><span class="perk">Snacks</span></span>
    <span class="job-card__remote"></span>
  </div>
</div>`;

      const dom = new JSDOM(html);
      const jobCard = dom.window.document.querySelector('.job-card');
      const job = parser.parseJobCard(jobCard!);

      expect(job).not.toBeNull();
      expect(job!.title).toBe('Frontend Dev');
      expect(job!.company).toBe('Acme');
      expect(job!.location).toBe('Berlin');
      expect(job!.applyLink).toContain('https://relocate.me/jobs/123');
      expect(job!.salary).toBe('€50k');
    });

    it('should return empty array on parse error', () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      const jobs = parser.parseJobs(null as any);
      expect(jobs).toEqual([]);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });
  });

  describe('parseJobCard', () => {
    it('should return null if required fields are missing', () => {
      const dom = new JSDOM('<div class="job-card"></div>');
      const card = dom.window.document.querySelector('.job-card');
      expect(parser.parseJobCard(card!)).toBeNull();
    });
    it('should handle error in job card parsing gracefully', () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      expect(parser.parseJobCard(undefined as any)).toBeNull();
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });
    it('should parse job card directly', () => {
      const html = `<div class="job-card">
        <h2 class="job-card__title"><a href="/jobs/123">Frontend Dev</a></h2>
        <div class="job-card__company">Acme</div>
        <div class="job-card__location">Berlin</div>
        <div class="job-card__date">2024-01-01</div>
        <div class="job-card__salary">€50k</div>
        <span class="job-card__tags"><span class="tag">Remote</span></span>
        <span class="job-card__benefits"><span class="benefit">Visa</span></span>
        <span class="job-card__perks"><span class="perk">Snacks</span></span>
        <span class="job-card__remote"></span>
      </div>`;

      const dom = new JSDOM(html);
      const jobCard = dom.window.document.querySelector('.job-card');

      expect(jobCard).not.toBeNull();

      const job = parser.parseJobCard(jobCard!);
      expect(job).not.toBeNull();
      expect(job!.title).toBe('Frontend Dev');
      expect(job!.company).toBe('Acme');
    });
  });

  describe('extractText', () => {
    it('should extract text content', () => {
      const dom = new JSDOM('<div><span class="foo">Bar</span></div>');
      const el = dom.window.document.querySelector('div');
      expect((parser as any).extractText(el, '.foo')).toBe('Bar');
    });
    it('should return empty string if not found', () => {
      const dom = new JSDOM('<div></div>');
      const el = dom.window.document.querySelector('div');
      expect((parser as any).extractText(el, '.foo')).toBe('');
    });
  });

  describe('extractAttribute', () => {
    it('should extract attribute value', () => {
      const dom = new JSDOM('<a class="foo" href="/bar">Link</a>');
      const el = dom.window.document;
      expect((parser as any).extractAttribute(el, '.foo', 'href')).toBe('/bar');
    });
    it('should return empty string if not found', () => {
      const dom = new JSDOM('<div></div>');
      const el = dom.window.document;
      expect((parser as any).extractAttribute(el, '.foo', 'href')).toBe('');
    });
  });

  describe('extractTags', () => {
    it('should extract tags', () => {
      const dom = new JSDOM(
        '<div><span class="tag">A</span><span class="tag">B</span></div>',
      );
      const card = dom.window.document.querySelector('div');
      Object.assign(RelocateV1Selectors, { tags: '.tag' });
      expect((parser as any).extractTags(card)).toEqual(['A', 'B']);
    });
    it('should handle error and return []', () => {
      expect((parser as any).extractTags(undefined)).toEqual([]);
    });
  });

  describe('extractBenefits', () => {
    it('should extract benefits and perks', () => {
      const dom = new JSDOM(
        '<div><span class="benefit">A</span><span class="perk">B</span></div>',
      );
      const card = dom.window.document.querySelector('div');
      Object.assign(RelocateV1Selectors, {
        benefits: '.benefit',
        perks: '.perk',
      });
      expect((parser as any).extractBenefits(card)).toEqual(['A', 'B']);
    });
    it('should handle error and return []', () => {
      expect((parser as any).extractBenefits(undefined)).toEqual([]);
    });
  });

  describe('extractJobType', () => {
    it('should detect Remote, On-site, Full-time, Part-time, Contract', () => {
      const dom = new JSDOM('<div><span class="remote"></span></div>');
      let card = dom.window.document.querySelector('div');
      Object.assign(RelocateV1Selectors, {
        remote: '.remote',
        onsite: '.onsite',
        fullTime: '.fulltime',
        partTime: '.parttime',
        contract: '.contract',
      });
      expect((parser as any).extractJobType(card)).toBe('Remote');
      dom.window.document.body.innerHTML =
        '<div><span class="onsite"></span></div>';
      card = dom.window.document.querySelector('div');
      expect((parser as any).extractJobType(card)).toBe('On-site');
      dom.window.document.body.innerHTML =
        '<div><span class="fulltime"></span></div>';
      card = dom.window.document.querySelector('div');
      expect((parser as any).extractJobType(card)).toBe('Full-time');
      dom.window.document.body.innerHTML =
        '<div><span class="parttime"></span></div>';
      card = dom.window.document.querySelector('div');
      expect((parser as any).extractJobType(card)).toBe('Part-time');
      dom.window.document.body.innerHTML =
        '<div><span class="contract"></span></div>';
      card = dom.window.document.querySelector('div');
      expect((parser as any).extractJobType(card)).toBe('Contract');
    });
    it('should handle error and return empty string', () => {
      expect((parser as any).extractJobType(undefined)).toBe('');
    });
  });

  describe('extractRelocationFeatures', () => {
    it('should detect visa sponsorship, relocation package, and English speaking', () => {
      const dom = new JSDOM(
        '<div><span class="visa-sponsorship"></span></div>',
      );
      let card = dom.window.document.querySelector('div');
      Object.assign(RelocateV1Selectors, {
        visaSponsorship: '.visa-sponsorship',
        relocationPackage: '.relocation-package',
        englishSpeaking: '.english-speaking',
      });
      expect((parser as any).extractRelocationFeatures(card)).toContain(
        'Visa Sponsorship',
      );
      dom.window.document.body.innerHTML =
        '<div><span class="relocation-package"></span></div>';
      card = dom.window.document.querySelector('div');
      expect((parser as any).extractRelocationFeatures(card)).toContain(
        'Relocation Package',
      );
      dom.window.document.body.innerHTML =
        '<div><span class="english-speaking"></span></div>';
      card = dom.window.document.querySelector('div');
      expect((parser as any).extractRelocationFeatures(card)).toContain(
        'English Speaking',
      );
    });
    it('should handle error and return []', () => {
      expect((parser as any).extractRelocationFeatures(undefined)).toEqual([]);
    });
  });

  describe('combineLocation', () => {
    it('should combine location, region, and country', () => {
      expect(
        (parser as any).combineLocation('Berlin', 'Germany', 'Berlin'),
      ).toBe('Berlin, Berlin, Germany');
    });
    it('should handle missing parts', () => {
      expect((parser as any).combineLocation('Berlin', '', '')).toBe('Berlin');
      expect((parser as any).combineLocation('', 'Germany', '')).toBe(
        'Germany',
      );
    });
    it('should return International for empty location', () => {
      expect((parser as any).combineLocation('', '', '')).toBe('International');
    });
  });

  describe('parseFlexibleDate integration', () => {
    it('should parse ISO date', () => {
      const date = parseFlexibleDate('2024-01-01');
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2024);
    });
    it('should parse relative date', () => {
      const now = new Date();
      const date = parseFlexibleDate('2 days ago');
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCDate()).toBe(now.getUTCDate() - 2);
    });
    it('should parse slash date formats', () => {
      const date = parseFlexibleDate('01/15/2023');
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2023);
    });
    it('should handle error and return new Date', () => {
      const date = parseFlexibleDate(undefined);
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('normalizeUrl', () => {
    it('should handle empty url', () => {
      expect((parser as any).normalizeUrl('')).toBe('');
    });
    it('should handle relative url', () => {
      expect((parser as any).normalizeUrl('/jobs/123')).toBe(
        'https://relocate.me/jobs/123',
      );
    });
    it('should handle non-http url', () => {
      expect((parser as any).normalizeUrl('jobs/123')).toBe(
        'https://relocate.me/jobs/123',
      );
    });
    it('should handle absolute url', () => {
      expect((parser as any).normalizeUrl('https://foo.com/bar')).toBe(
        'https://foo.com/bar',
      );
    });
  });

  describe('generateSourceId', () => {
    it('should generate a normalized source id', () => {
      expect((parser as any).generateSourceId('Foo Bar', 'Acme!')).toBe(
        'foo-bar-acme-',
      );
    });
  });

  describe('hasNextPage', () => {
    it('should detect next page', () => {
      Object.assign(RelocateV1Selectors, { nextPage: '.next' });
      const html = '<div><a class="next">Next</a></div>';
      expect(parser.hasNextPage(html)).toBe(true);
    });
    it('should return false if no next page', () => {
      Object.assign(RelocateV1Selectors, { nextPage: '.next' });
      const html = '<div>No next</div>';
      expect(parser.hasNextPage(html)).toBe(false);
    });
    it('should handle error and return false', () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      expect(parser.hasNextPage(undefined as any)).toBe(false);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });
  });

  describe('getCurrentPage', () => {
    it('should get current page number', () => {
      Object.assign(RelocateV1Selectors, { currentPage: '.current' });
      const html = '<div><span class="current">3</span></div>';
      expect(parser.getCurrentPage(html)).toBe(3);
    });
    it('should default to 1 if not found', () => {
      Object.assign(RelocateV1Selectors, { currentPage: '.current' });
      const html = '<div>No current</div>';
      expect(parser.getCurrentPage(html)).toBe(1);
    });
    it('should handle error and return 1', () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      expect(parser.getCurrentPage(undefined as any)).toBe(1);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });
  });
});
