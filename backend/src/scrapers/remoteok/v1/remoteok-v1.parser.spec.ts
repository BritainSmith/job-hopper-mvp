import { RemoteOKV1Parser } from './remoteok-v1.parser';
import { RemoteOKV1Selectors } from './remoteok-v1.selectors';
import { JSDOM } from 'jsdom';
import { parseFlexibleDate } from '../../../common/utils/date.util';

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
  Injectable: () => (target: any) => target,
}));

describe('RemoteOKV1Parser', () => {
  let parser: RemoteOKV1Parser;

  beforeEach(() => {
    parser = new RemoteOKV1Parser();
  });

  describe('parseJobs', () => {
    it('should parse jobs from valid HTML', () => {
      const html = `
        <div>
          <div class="job-card">
            <h2 class="title">Backend Dev</h2>
            <div class="company">Globex</div>
            <div class="location">Remote</div>
            <a class="apply-link" href="/jobs/456">Apply</a>
            <div class="posted-date">2024-02-02</div>
            <div class="salary">$100k</div>
            <span class="tag">Python</span>
            <span class="tag">Django</span>
          </div>
        </div>
      `;
      Object.assign(RemoteOKV1Selectors, {
        jobCards: '.job-card',
        title: '.title',
        company: '.company',
        location: '.location',
        applyLink: '.apply-link',
        postedDate: '.posted-date',
        salary: '.salary',
        tags: '.tag',
        nextPage: '.next',
        currentPage: '.current',
      });
      const jobs = parser.parseJobs(html);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Backend Dev');
      expect(jobs[0].company).toBe('Globex');
      expect(jobs[0].location).toBe('Remote');
      expect(jobs[0].applyLink).toContain('https://remoteok.com/jobs/456');
      expect(jobs[0].salary).toBe('$100k');
      expect(jobs[0].tags).toEqual(['Python', 'Django']);
      expect(jobs[0].status).toBe('ACTIVE');
      expect(jobs[0].applied).toBe(false);
      expect(jobs[0].source).toBe('RemoteOK');
      expect(jobs[0].sourceId).toBe('backend-dev-globex');
    });
    it('should return empty array on parse error', () => {
      const jobs = parser.parseJobs(null as any);
      expect(jobs).toEqual([]);
    });
  });

  describe('parseJobCard', () => {
    it('should return null if required fields are missing', () => {
      const dom = new JSDOM('<div class="job-card"></div>');
      const card = dom.window.document.querySelector('.job-card');
      expect(parser.parseJobCard(card)).toBeNull();
    });
    it('should handle error in job card parsing gracefully', () => {
      expect(parser.parseJobCard(undefined as any)).toBeNull();
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
      const dom = new JSDOM('<div><span class="tag">A</span><span class="tag">B</span></div>');
      const card = dom.window.document.querySelector('div');
      Object.assign(RemoteOKV1Selectors, { tags: '.tag' });
      expect((parser as any).extractTags(card)).toEqual(['A', 'B']);
    });
    it('should handle error and return []', () => {
      expect((parser as any).extractTags(undefined)).toEqual([]);
    });
  });

  describe('parseFlexibleDate integration', () => {
    it('should parse ISO date', () => {
      const date = parseFlexibleDate('2024-02-02');
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2024);
    });
    it('should parse relative date', () => {
      const now = new Date();
      const date = parseFlexibleDate('2 days ago');
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCDate()).toBe(now.getUTCDate() - 2);
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
      expect((parser as any).normalizeUrl('/jobs/456')).toBe('https://remoteok.com/jobs/456');
    });
    it('should handle non-http url', () => {
      expect((parser as any).normalizeUrl('jobs/456')).toBe('https://jobs/456');
    });
    it('should handle absolute url', () => {
      expect((parser as any).normalizeUrl('https://foo.com/bar')).toBe('https://foo.com/bar');
    });
  });

  describe('generateSourceId', () => {
    it('should generate a normalized source id', () => {
      expect((parser as any).generateSourceId('Foo Bar', 'Globex!')).toBe('foo-bar-globex-');
    });
  });

  describe('hasNextPage', () => {
    it('should detect next page', () => {
      Object.assign(RemoteOKV1Selectors, { nextPage: '.next' });
      const html = '<div><a class="next">Next</a></div>';
      expect(parser.hasNextPage(html)).toBe(true);
    });
    it('should return false if no next page', () => {
      Object.assign(RemoteOKV1Selectors, { nextPage: '.next' });
      const html = '<div>No next</div>';
      expect(parser.hasNextPage(html)).toBe(false);
    });
    it('should handle error and return false', () => {
      expect(parser.hasNextPage(undefined as any)).toBe(false);
    });
  });

  describe('getCurrentPage', () => {
    it('should get current page number', () => {
      Object.assign(RemoteOKV1Selectors, { currentPage: '.current' });
      const html = '<div><span class="current">5</span></div>';
      expect(parser.getCurrentPage(html)).toBe(5);
    });
    it('should default to 1 if not found', () => {
      Object.assign(RemoteOKV1Selectors, { currentPage: '.current' });
      const html = '<div>No current</div>';
      expect(parser.getCurrentPage(html)).toBe(1);
    });
    it('should handle error and return 1', () => {
      expect(parser.getCurrentPage(undefined as any)).toBe(1);
    });
  });
}); 