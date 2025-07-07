import { Test, TestingModule } from '@nestjs/testing';
import { DataCleaningService } from './data-cleaning.service';
import { Job as PrismaJob } from '@prisma/client';

describe('DataCleaningService', () => {
  let service: DataCleaningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataCleaningService],
    }).compile();

    service = module.get<DataCleaningService>(DataCleaningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanJobData', () => {
    const mockJob: PrismaJob = {
      id: 1,
      title: 'Senior JavaScript Developer',
      company: 'Tech Corp Inc.',
      location: 'San Francisco, CA',
      applyLink: 'https://example.com/apply',
      postedDate: '2024-01-15',
      salary: '$80,000 - $120,000',
      tags: 'javascript,react,node.js',
      source: 'remoteok',
      dateScraped: new Date('2024-01-15'),
      lastUpdated: new Date('2024-01-15'),
      applied: false,
      appliedAt: null,
      status: 'ACTIVE',
      searchText: null,
      companyId: null,
    };

    it('should clean and normalize job data correctly', () => {
      const result = service.cleanJobData(mockJob);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Senior JavaScript Developer');
      expect(result.normalizedTitle).toBe('javascript developer');
      expect(result.normalizedCompany).toBe('tech');
      expect(result.normalizedLocation).toBe('san francisco, ca');
      expect(result.extractedSkills).toContain('javascript');
      expect(result.extractedSkills).toContain('react');
      expect(result.extractedSkills).toContain('node.js');
      expect(result.salaryRange).toEqual({
        min: 80000,
        max: 120000,
        currency: 'USD',
      });
      expect(result.experienceLevel).toBe('senior');
      expect(result.jobType).toBe('unknown');
      expect(result.remoteType).toBe('unknown');
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should handle missing optional fields', () => {
      const jobWithoutOptionalFields: PrismaJob = {
        ...mockJob,
        postedDate: null,
        salary: null,
        tags: null,
      };

      const result = service.cleanJobData(jobWithoutOptionalFields);

      expect(result.postedDate).toBeNull();
      expect(result.salary).toBeNull();
      expect(result.extractedSkills).toContain('javascript');
      expect(result.salaryRange).toBeNull();
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should extract skills from title when tags are missing', () => {
      const jobWithSkillsInTitle: PrismaJob = {
        ...mockJob,
        title: 'Python Data Scientist with Machine Learning',
        tags: null,
      };

      const result = service.cleanJobData(jobWithSkillsInTitle);

      expect(result.extractedSkills).toContain('python');
      expect(result.extractedSkills).toContain('machine learning');
    });

    it('should handle various salary formats', () => {
      const salaryFormats = [
        {
          input: '$50,000 - $80,000',
          expected: { min: 50000, max: 80000, currency: 'USD' },
        },
        {
          input: '60,000 - 90,000 USD',
          expected: { min: 60000, max: 90000, currency: 'USD' },
        },
        {
          input: '$75,000 to $100,000',
          expected: { min: 75000, max: 100000, currency: 'USD' },
        },
        {
          input: '$60,000 to $90,000',
          expected: { min: 60000, max: 90000, currency: 'USD' },
        },
      ];

      salaryFormats.forEach(({ input, expected }) => {
        const jobWithSalary: PrismaJob = { ...mockJob, salary: input };
        const result = service.cleanJobData(jobWithSalary);
        expect(result.salaryRange).toEqual(expected);
      });
    });

    it('should return null for unparseable salary', () => {
      const jobWithBadSalary: PrismaJob = {
        ...mockJob,
        salary: 'Competitive salary',
      };
      const result = service.cleanJobData(jobWithBadSalary);
      expect(result.salaryRange).toBeNull();
    });

    it('should detect experience levels correctly', () => {
      const experienceTests = [
        { title: 'Junior Developer', expected: 'entry' },
        { title: 'Mid-level Engineer', expected: 'mid' },
        { title: 'Senior Software Engineer', expected: 'senior' },
        { title: 'Lead Developer', expected: 'senior' },
        { title: 'Software Engineer', expected: 'unknown' },
      ];

      experienceTests.forEach(({ title, expected }) => {
        const jobWithTitle: PrismaJob = { ...mockJob, title };
        const result = service.cleanJobData(jobWithTitle);
        expect(result.experienceLevel).toBe(expected);
      });
    });

    it('should detect job types correctly', () => {
      const jobTypeTests = [
        { title: 'Full-time Developer', expected: 'full-time' },
        { title: 'Part-time Engineer', expected: 'part-time' },
        { title: 'Contract Developer', expected: 'contract' },
        { title: 'Internship Position', expected: 'internship' },
        { title: 'Software Engineer', expected: 'unknown' },
      ];

      jobTypeTests.forEach(({ title, expected }) => {
        const jobWithTitle: PrismaJob = { ...mockJob, title };
        const result = service.cleanJobData(jobWithTitle);
        expect(result.jobType).toBe(expected);
      });
    });

    it('should detect remote types correctly', () => {
      const remoteTests = [
        { title: 'Remote Developer', location: 'Remote', expected: 'remote' },
        { title: 'Hybrid Engineer', location: 'New York', expected: 'hybrid' },
        {
          title: 'On-site Developer',
          location: 'San Francisco',
          expected: 'onsite',
        },
        { title: 'Software Engineer', location: 'Austin', expected: 'unknown' },
      ];

      remoteTests.forEach(({ title, location, expected }) => {
        const jobWithDetails: PrismaJob = { ...mockJob, title, location };
        const result = service.cleanJobData(jobWithDetails);
        expect(result.remoteType).toBe(expected);
      });
    });
  });

  describe('getDataQualityMetrics', () => {
    it('should calculate quality metrics correctly', async () => {
      const mockJobs: PrismaJob[] = [
        {
          id: 1,
          title: 'Developer',
          company: 'Company A',
          location: 'Location A',
          applyLink: 'https://example.com',
          postedDate: '2024-01-15',
          salary: '$50,000',
          tags: 'javascript,react',
          source: 'remoteok',
          dateScraped: new Date(),
          lastUpdated: new Date(),
          applied: false,
          appliedAt: null,
          status: 'ACTIVE',
          searchText: null,
          companyId: null,
        },
        {
          id: 2,
          title: 'Engineer',
          company: 'Company B',
          location: 'Location B',
          applyLink: 'https://example2.com',
          postedDate: null,
          salary: null,
          tags: null,
          source: 'remoteok',
          dateScraped: new Date(),
          lastUpdated: new Date(),
          applied: false,
          appliedAt: null,
          status: 'ACTIVE',
          searchText: null,
          companyId: null,
        },
      ];

      const result = await service.getDataQualityMetrics(mockJobs);

      expect(result.totalJobs).toBe(2);
      expect(result.jobsWithCompleteData).toBe(2);
      expect(result.jobsWithSalary).toBe(1);
      expect(result.jobsWithSkills).toBe(1);
      expect(result.averageQualityScore).toBeGreaterThan(0);
      expect(result.commonIssues).toBeDefined();
      expect(result.commonIssues.length).toBeGreaterThan(0);
    });

    it('should handle empty job list', async () => {
      const result = await service.getDataQualityMetrics([]);

      expect(result.totalJobs).toBe(0);
      expect(result.jobsWithCompleteData).toBe(0);
      expect(result.jobsWithSalary).toBe(0);
      expect(result.jobsWithSkills).toBe(0);
      expect(result.averageQualityScore).toBe(0);
      expect(result.commonIssues).toEqual([]);
    });

    it('should identify missing fields correctly', async () => {
      const incompleteJob: PrismaJob = {
        id: 1,
        title: 'Developer',
        company: '', // Missing company
        location: 'Location A',
        applyLink: '', // Missing apply link
        postedDate: null,
        salary: null,
        tags: null,
        source: 'remoteok',
        dateScraped: new Date(),
        lastUpdated: new Date(),
        applied: false,
        appliedAt: null,
        status: 'ACTIVE',
        searchText: null,
        companyId: null,
      };

      const result = await service.getDataQualityMetrics([incompleteJob]);

      expect(result.jobsWithCompleteData).toBe(0);
      expect(
        result.commonIssues.some((issue) =>
          issue.issue.includes('Missing: company, applyLink'),
        ),
      ).toBe(true);
    });
  });

  describe('exportCleanedData', () => {
    it('should export cleaned data for all jobs', async () => {
      const mockJobs: PrismaJob[] = [
        {
          id: 1,
          title: 'JavaScript Developer',
          company: 'Tech Corp',
          location: 'Remote',
          applyLink: 'https://example.com',
          postedDate: '2024-01-15',
          salary: '$60,000 - $90,000',
          tags: 'javascript,react',
          source: 'remoteok',
          dateScraped: new Date(),
          lastUpdated: new Date(),
          applied: false,
          appliedAt: null,
          status: 'ACTIVE',
          searchText: null,
          companyId: null,
        },
      ];

      const result = await service.exportCleanedData(mockJobs);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('normalizedTitle');
      expect(result[0]).toHaveProperty('normalizedCompany');
      expect(result[0]).toHaveProperty('normalizedLocation');
      expect(result[0]).toHaveProperty('extractedSkills');
      expect(result[0]).toHaveProperty('salaryRange');
      expect(result[0]).toHaveProperty('experienceLevel');
      expect(result[0]).toHaveProperty('jobType');
      expect(result[0]).toHaveProperty('remoteType');
      expect(result[0]).toHaveProperty('qualityScore');
    });

    it('should handle empty job list', async () => {
      const result = await service.exportCleanedData([]);
      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle jobs with very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const jobWithLongTitle: PrismaJob = {
        ...mockJob,
        title: longTitle,
      };

      const result = service.cleanJobData(jobWithLongTitle);
      expect(result.normalizedTitle).toBeDefined();
      expect(result.normalizedTitle.length).toBeLessThanOrEqual(
        longTitle.length,
      );
    });

    it('should handle jobs with special characters', () => {
      const jobWithSpecialChars: PrismaJob = {
        ...mockJob,
        title: 'Developer (React/Node.js) @ Tech Corp!',
        company: 'Tech Corp & Associates, Inc.',
        location: 'San Francisco, CA - USA',
      };

      const result = service.cleanJobData(jobWithSpecialChars);
      expect(result.normalizedTitle).not.toContain('(');
      expect(result.normalizedTitle).not.toContain(')');
      expect(result.normalizedTitle).not.toContain('@');
      expect(result.normalizedCompany).not.toContain('&');
      expect(result.normalizedCompany).not.toContain(',');
    });

    it('should handle jobs with empty strings', () => {
      const jobWithEmptyStrings: PrismaJob = {
        ...mockJob,
        title: '',
        company: '',
        location: '',
        tags: '',
      };

      const result = service.cleanJobData(jobWithEmptyStrings);
      expect(result.normalizedTitle).toBe('');
      expect(result.normalizedCompany).toBe('');
      expect(result.normalizedLocation).toBe('');
      expect(result.extractedSkills).toEqual([]);
    });
  });
});

// Helper for tests
const mockJob: PrismaJob = {
  id: 1,
  title: 'Test Developer',
  company: 'Test Company',
  location: 'Test Location',
  applyLink: 'https://test.com',
  postedDate: '2024-01-15',
  salary: '$50,000',
  tags: 'test,developer',
  source: 'test',
  dateScraped: new Date(),
  lastUpdated: new Date(),
  applied: false,
  appliedAt: null,
  status: 'ACTIVE',
  searchText: null,
  companyId: null,
};
