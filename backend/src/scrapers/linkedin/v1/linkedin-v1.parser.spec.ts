import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInV1Parser } from './linkedin-v1.parser';
import { JSDOM } from 'jsdom';

describe('LinkedInV1Parser', () => {
  let parser: LinkedInV1Parser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkedInV1Parser],
    }).compile();

    parser = module.get<LinkedInV1Parser>(LinkedInV1Parser);
  });

  describe('parseJobs', () => {
    it('should parse valid LinkedIn job HTML', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">
            <a class="job-search-card__title-link" href="/jobs/view/123">Senior Software Engineer</a>
          </h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
          <span class="job-search-card__location">San Francisco, CA</span>
          <time class="job-search-card__listdate">2 days ago</time>
          <span class="job-search-card__salary-info">$120k - $150k</span>
          <div class="job-search-card__metadata-item">React</div>
          <div class="job-search-card__metadata-item">Node.js</div>
        </div>
      `;

      const jobs = parser.parseJobs(html);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Senior Software Engineer');
      expect(jobs[0].company).toBe('TechCorp');
      expect(jobs[0].location).toBe('San Francisco, CA');
      expect(jobs[0].applyLink).toBe('https://linkedin.com/jobs/view/123');
      expect(jobs[0].salary).toBe('$120k - $150k');
      expect(jobs[0].tags).toContain('React');
      expect(jobs[0].tags).toContain('Node.js');
      expect(jobs[0].source).toBe('LinkedIn');
    });

    it('should parse multiple job cards', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Job 1</h3>
          <h4 class="job-search-card__subtitle">Company 1</h4>
        </div>
        <div class="job-search-card">
          <h3 class="job-search-card__title">Job 2</h3>
          <h4 class="job-search-card__subtitle">Company 2</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);

      expect(jobs).toHaveLength(2);
      expect(jobs[0].title).toBe('Job 1');
      expect(jobs[1].title).toBe('Job 2');
    });

    it('should handle missing optional fields', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Software Engineer');
      expect(jobs[0].company).toBe('TechCorp');
      expect(jobs[0].location).toBe('Remote'); // Default value
      expect(jobs[0].salary).toBe('');
      expect(jobs[0].tags).toEqual([]);
    });

    it('should skip jobs with missing required fields', () => {
      const html = `
        <div class="job-search-card">
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Software Engineer');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<malformed>html</malformed>';

      const jobs = parser.parseJobs(html);

      expect(jobs).toHaveLength(0);
    });

    it('should handle empty HTML', () => {
      const jobs = parser.parseJobs('');

      expect(jobs).toHaveLength(0);
    });
  });

  describe('date parsing', () => {
    it('should parse relative dates correctly', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
          <time class="job-search-card__listdate">2 days ago</time>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.postedDate).toBeInstanceOf(Date);
      // Should be approximately 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(
        Math.abs(job.postedDate.getTime() - twoDaysAgo.getTime()),
      ).toBeLessThan(24 * 60 * 60 * 1000); // Within 1 day
    });

    it('should parse hours ago', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
          <time class="job-search-card__listdate">3 hours ago</time>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.postedDate).toBeInstanceOf(Date);
    });

    it('should handle invalid dates gracefully', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
          <time class="job-search-card__listdate">invalid date</time>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.postedDate).toBeInstanceOf(Date);
    });
  });

  describe('URL normalization', () => {
    it('should normalize relative URLs', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">
            <a class="job-search-card__title-link" href="/jobs/view/123">Software Engineer</a>
          </h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.applyLink).toBe('https://linkedin.com/jobs/view/123');
    });

    it('should handle absolute URLs', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">
            <a class="job-search-card__title-link" href="https://linkedin.com/jobs/view/123">Software Engineer</a>
          </h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.applyLink).toBe('https://linkedin.com/jobs/view/123');
    });

    it('should handle missing URLs', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.applyLink).toBe('');
    });
  });

  describe('source ID generation', () => {
    it('should generate consistent source IDs', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Senior Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      expect(job.sourceId).toBe('senior-software-engineer-techcorp');
    });

    it('should handle special characters in source ID', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">DevOps Engineer</h3>
          <h4 class="job-search-card__subtitle">Tech Corp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      // The implementation replaces special chars with hyphens and removes consecutive hyphens
      // "DevOps Engineer" + "Tech Corp" becomes "devops-engineer-tech-corp"
      expect(job.sourceId).toBe('devops-engineer-tech-corp');
    });
  });

  describe('pagination detection', () => {
    it('should detect next page', () => {
      const html = `
        <div class="job-search-card">Job content</div>
        <button class="artdeco-pagination__button--next">Next</button>
      `;

      const hasNext = parser.hasNextPage(html);

      expect(hasNext).toBe(true);
    });

    it('should detect no next page', () => {
      const html = `
        <div class="job-search-card">Job content</div>
      `;

      const hasNext = parser.hasNextPage(html);

      expect(hasNext).toBe(false);
    });

    it('should get current page number', () => {
      const html = `
        <div class="job-search-card">Job content</div>
        <li class="artdeco-pagination__indicator--active">2</li>
      `;

      const currentPage = parser.getCurrentPage(html);

      expect(currentPage).toBe(2);
    });

    it('should default to page 1 when no indicator found', () => {
      const html = `
        <div class="job-search-card">Job content</div>
      `;

      const currentPage = parser.getCurrentPage(html);

      expect(currentPage).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', () => {
      const html = '<malformed>html</malformed>';

      const jobs = parser.parseJobs(html);

      expect(jobs).toHaveLength(0);
    });

    it('should handle missing elements gracefully', () => {
      const html = `
        <div class="job-search-card">
          <h3 class="job-search-card__title">Software Engineer</h3>
          <h4 class="job-search-card__subtitle">TechCorp</h4>
        </div>
      `;

      const jobs = parser.parseJobs(html);
      const job = jobs[0];

      // Should have default values for missing fields
      expect(job.location).toBe('Remote');
      expect(job.salary).toBe('');
      expect(job.tags).toEqual([]);
    });
  });

  describe('parseJobCard', () => {
    it('should return null if required fields are missing', () => {
      const dom = new JSDOM('<div class="job-search-card"></div>');
      const card = dom.window.document.querySelector('.job-search-card');
      expect(parser.parseJobCard(card!)).toBeNull();
    });
  });
});
