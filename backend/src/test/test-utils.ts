import { PrismaService } from '../prisma/prisma.service';
import { Job, Company } from '@prisma/client';

export interface CreateJobData {
  title: string;
  company: string;
  location?: string;
  applyLink: string;
  postedDate?: string;
  salary?: string;
  source?: string;
  tags?: string;
}

export interface CreateCompanyData {
  name: string;
  website?: string;
  description?: string;
}

export class TestUtils {
  static async createTestJob(
    prisma: PrismaService,
    data: CreateJobData,
  ): Promise<Job> {
    return prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location || 'Remote',
        applyLink: data.applyLink,
        postedDate: data.postedDate,
        salary: data.salary,
        source: data.source || 'test',
        tags: data.tags,
        searchText: `${data.title} ${data.company} ${data.location || 'Remote'}`,
      },
    });
  }

  static async createTestCompany(
    prisma: PrismaService,
    data: CreateCompanyData,
  ): Promise<Company> {
    return prisma.company.create({
      data: {
        name: data.name,
        website: data.website,
        description: data.description,
      },
    });
  }

  static async createTestJobWithCompany(
    prisma: PrismaService,
    jobData: CreateJobData,
    companyData: CreateCompanyData,
  ): Promise<{ job: Job; company: Company }> {
    const company = await this.createTestCompany(prisma, companyData);
    const job = await prisma.job.create({
      data: {
        ...jobData,
        location: jobData.location || 'Remote',
        source: jobData.source || 'test',
        companyId: company.id,
        searchText: `${jobData.title} ${jobData.company} ${jobData.location || 'Remote'}`,
      },
    });

    return { job, company };
  }

  static generateMockJobData(
    overrides: Partial<CreateJobData> = {},
  ): CreateJobData {
    return {
      title: 'Software Engineer',
      company: 'Test Company',
      location: 'Remote',
      applyLink: `https://example.com/job-${Date.now()}`,
      postedDate: '2d ago',
      salary: '$80k - $120k',
      source: 'test',
      tags: JSON.stringify(['JavaScript', 'TypeScript', 'React']),
      ...overrides,
    };
  }

  static generateMockCompanyData(
    overrides: Partial<CreateCompanyData> = {},
  ): CreateCompanyData {
    return {
      name: 'Test Company',
      website: 'https://testcompany.com',
      description: 'A test company for integration tests',
      ...overrides,
    };
  }

  static async createMultipleTestJobs(
    prisma: PrismaService,
    count: number,
    baseData: Partial<CreateJobData> = {},
  ): Promise<Job[]> {
    const jobs: Job[] = [];

    for (let i = 0; i < count; i++) {
      const jobData = this.generateMockJobData({
        title: `Software Engineer ${i + 1}`,
        applyLink: `https://example.com/job-${i + 1}-${Date.now()}`,
        ...baseData,
      });

      const job = await this.createTestJob(prisma, jobData);
      jobs.push(job);
    }

    return jobs;
  }

  static async cleanupTestData(prisma: PrismaService): Promise<void> {
    await prisma.job.deleteMany({
      where: {
        source: 'test',
      },
    });

    await prisma.company.deleteMany({
      where: {
        name: {
          contains: 'Test',
        },
      },
    });
  }
}
