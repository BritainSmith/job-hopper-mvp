import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Job, Prisma } from '@prisma/client';

// Type Definitions
export type JobCreateInput = Prisma.JobCreateInput;
export type JobUpdateInput = Prisma.JobUpdateInput;

export interface JobFilter {
  company?: string;
  location?: string;
  status?: string;
  applied?: boolean;
  source?: string;
  tags?: string[];
  searchText?: string;
}

export interface PaginationOptions {
  skip?: number;
  take?: number;
  orderBy?: Prisma.JobOrderByWithRelationInput;
}

@Injectable()
export class JobRepository {
  constructor(private prisma: PrismaService) {}

  // Create a new job
  async createJob(data: JobCreateInput): Promise<Job> {
    return this.prisma.job.create({ data });
  }

  // Get a job by ID
  async getJobById(id: number): Promise<Job | null> {
    return this.prisma.job.findUnique({ where: { id } });
  }

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
    
    return this.prisma.job.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
    });
  }

  // Update a job by ID
  async updateJob(id: number, data: JobUpdateInput): Promise<Job> {
    return this.prisma.job.update({ where: { id }, data });
  }

  // Delete a job by ID
  async deleteJob(id: number): Promise<Job> {
    return this.prisma.job.delete({ where: { id } });
  }

  // Upsert a job (create if not exists, update if exists by unique applyLink)
  async upsertJob(data: JobCreateInput): Promise<Job> {
    return this.prisma.job.upsert({
      where: { applyLink: data.applyLink },
      update: data,
      create: data,
    });
  }

  // Get job statistics
  async getJobStats(): Promise<{
    total: number;
    applied: number;
    notApplied: number;
    byStatus: Record<string, number>;
  }> {
    const [total, applied, notApplied, statusStats] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.job.count({ where: { applied: true } }),
      this.prisma.job.count({ where: { applied: false } }),
      this.prisma.job.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status || 'unknown'] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    return { total, applied, notApplied, byStatus };
  }
} 