import { Prisma, Job as PrismaJob, JobStatus } from '@prisma/client';
import { ScrapingOptions } from '../scrapers/base/interfaces';
import {
  JobSearchOptions,
  JobApplicationData,
  JobStats,
} from '../services/job.service';
import { PaginationOptions } from '../repositories/job.repository';

export interface IJobService {
  createJob(jobData: Prisma.JobCreateInput): Promise<PrismaJob>;
  getJobById(id: number): Promise<PrismaJob | null>;
  updateJob(id: number, updateData: Prisma.JobUpdateInput): Promise<PrismaJob>;
  deleteJob(id: number): Promise<PrismaJob>;
  searchJobs(options: JobSearchOptions): Promise<PrismaJob[]>;
  getJobsByStatus(
    status: JobStatus,
    pagination?: PaginationOptions,
  ): Promise<PrismaJob[]>;
  getAppliedJobs(pagination?: PaginationOptions): Promise<PrismaJob[]>;
  getActiveJobs(pagination?: PaginationOptions): Promise<PrismaJob[]>;
  getAllJobs(): Promise<PrismaJob[]>;
  applyToJob(
    id: number,
    applicationData?: JobApplicationData,
  ): Promise<PrismaJob>;
  updateApplicationStatus(id: number, status: JobStatus): Promise<PrismaJob>;
  scrapeAndSaveJobs(
    source?: string,
    options?: ScrapingOptions,
  ): Promise<{ scraped: number; saved: number }>;
  getJobStats(): Promise<JobStats>;
  bulkUpdateStatus(jobIds: number[], status: JobStatus): Promise<number>;
  findDuplicateJobs(jobData: Prisma.JobCreateInput): Promise<PrismaJob[]>;
}
