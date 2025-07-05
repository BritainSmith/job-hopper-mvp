import { PrismaClient, Job, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- Type Definitions ---

// Input for creating a job
export type JobCreateInput = Prisma.JobCreateInput;

// Input for updating a job
export type JobUpdateInput = Prisma.JobUpdateInput;

// Filtering options for querying jobs
export interface JobFilter {
  company?: string;
  location?: string;
  status?: string;
  applied?: boolean;
  source?: string;
  tags?: string[];
  searchText?: string;
}

// Pagination options
export interface PaginationOptions {
  skip?: number;
  take?: number;
  orderBy?: Prisma.JobOrderByWithRelationInput;
}

// --- Repository Functions ---

export const jobRepository = {
  // Create a new job
  async createJob(data: JobCreateInput): Promise<Job> {
    return prisma.job.create({ data });
  },

  // Get a job by ID
  async getJobById(id: number): Promise<Job | null> {
    return prisma.job.findUnique({ where: { id } });
  },

  // Get jobs with optional filtering and pagination
  async getJobs(filter: JobFilter = {}, options: PaginationOptions = {}): Promise<Job[]> {
    const where: Prisma.JobWhereInput = {
      company: filter.company,
      location: filter.location,
      status: filter.status as any,
      applied: filter.applied,
      source: filter.source,
      tags: filter.tags ? { contains: filter.tags.join(',') } : undefined,
      searchText: filter.searchText ? { contains: filter.searchText } : undefined,
    };
    return prisma.job.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
    });
  },

  // Update a job by ID
  async updateJob(id: number, data: JobUpdateInput): Promise<Job> {
    return prisma.job.update({ where: { id }, data });
  },

  // Delete a job by ID
  async deleteJob(id: number): Promise<Job> {
    return prisma.job.delete({ where: { id } });
  },

  // Upsert a job (create if not exists, update if exists by unique applyLink)
  async upsertJob(data: JobCreateInput): Promise<Job> {
    return prisma.job.upsert({
      where: { applyLink: data.applyLink },
      update: data,
      create: data,
    });
  },
}; 