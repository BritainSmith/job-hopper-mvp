import { Injectable, Logger } from '@nestjs/common';
import { JobRepository, JobFilter, PaginationOptions } from '../repositories/job.repository';
import { Job, JobStatus, Prisma } from '@prisma/client';
import { RemoteOKService, JobListing } from '../scrapers/remoteok.service';
import { LoggingService } from '../common/services/logging.service';

// Service Types
export interface JobSearchOptions {
  query?: string;
  filters?: JobFilter;
  pagination?: PaginationOptions;
}

export interface JobApplicationData {
  appliedAt?: Date;
  status?: JobStatus;
  notes?: string;
}

export interface JobStats {
  total: number;
  applied: number;
  active: number;
  byStatus: Record<JobStatus, number>;
  byCompany: Record<string, number>;
  byLocation: Record<string, number>;
}

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private jobRepository: JobRepository,
    private remoteOKService: RemoteOKService,
    private loggingService: LoggingService
  ) {}

  // --- CRUD Operations ---

  async createJob(jobData: Prisma.JobCreateInput): Promise<Job> {
    try {
      // Add searchable text for better search
      const searchText = this.generateSearchText(jobData);
      const jobWithSearch = { ...jobData, searchText };
      
      return await this.jobRepository.createJob(jobWithSearch);
    } catch (error) {
      this.logger.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  async getJobById(id: number): Promise<Job | null> {
    try {
      return await this.jobRepository.getJobById(id);
    } catch (error) {
      this.logger.error('Error fetching job:', error);
      throw new Error('Failed to fetch job');
    }
  }

  async updateJob(id: number, updateData: Prisma.JobUpdateInput): Promise<Job> {
    try {
      // Update search text if relevant fields changed
      if (updateData.title || updateData.company || updateData.tags) {
        const existingJob = await this.jobRepository.getJobById(id);
        if (existingJob) {
          const updatedData = { ...existingJob, ...updateData };
          updateData.searchText = this.generateSearchText(updatedData);
        }
      }
      
      return await this.jobRepository.updateJob(id, updateData);
    } catch (error) {
      this.logger.error('Error updating job:', error);
      throw new Error('Failed to update job');
    }
  }

  async deleteJob(id: number): Promise<Job> {
    try {
      return await this.jobRepository.deleteJob(id);
    } catch (error) {
      this.logger.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  // --- Search and Filtering ---

  async searchJobs(options: JobSearchOptions): Promise<Job[]> {
    try {
      const { query, filters = {}, pagination = {} } = options;
      
      // Add search query to filters
      if (query) {
        filters.searchText = query;
      }

      // Default sorting by most recent
      const defaultOrderBy: Prisma.JobOrderByWithRelationInput = { dateScraped: 'desc' };
      const finalPagination = {
        ...pagination,
        orderBy: pagination.orderBy || defaultOrderBy
      };

      return await this.jobRepository.getJobs(filters, finalPagination);
    } catch (error) {
      this.logger.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  async getJobsByStatus(status: JobStatus, pagination?: PaginationOptions): Promise<Job[]> {
    return this.searchJobs({
      filters: { status },
      pagination
    });
  }

  async getAppliedJobs(pagination?: PaginationOptions): Promise<Job[]> {
    return this.searchJobs({
      filters: { applied: true },
      pagination
    });
  }

  async getActiveJobs(pagination?: PaginationOptions): Promise<Job[]> {
    return this.searchJobs({
      filters: { status: 'ACTIVE' },
      pagination
    });
  }

  // --- Application Tracking ---

  async applyToJob(id: number, applicationData?: JobApplicationData): Promise<Job> {
    try {
      const updateData: Prisma.JobUpdateInput = {
        applied: true,
        appliedAt: applicationData?.appliedAt || new Date(),
        status: applicationData?.status || 'APPLIED'
      };

      return await this.updateJob(id, updateData);
    } catch (error) {
      this.logger.error('Error applying to job:', error);
      throw new Error('Failed to apply to job');
    }
  }

  async updateApplicationStatus(id: number, status: JobStatus, notes?: string): Promise<Job> {
    try {
      const updateData: Prisma.JobUpdateInput = {
        status,
        applied: status !== 'ACTIVE' // Mark as applied if not active
      };

      if (status === 'APPLIED' && !updateData.appliedAt) {
        updateData.appliedAt = new Date();
      }

      return await this.updateJob(id, updateData);
    } catch (error) {
      this.logger.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

  // --- Scraping Integration ---

  async scrapeAndSaveJobs(source: string = 'remoteok', options?: any): Promise<{ scraped: number; saved: number }> {
    const startTime = Date.now();
    
    try {
      this.loggingService.log(`Starting to scrape jobs from ${source}`, { source, options });
      
      let scrapedJobs: JobListing[] = [];
      
      // Use appropriate scraper based on source
      switch (source.toLowerCase()) {
        case 'remoteok':
          scrapedJobs = await this.remoteOKService.scrapeJobs(options);
          break;
        default:
          throw new Error(`Unsupported source: ${source}`);
      }

      const scrapeDuration = Date.now() - startTime;
      this.loggingService.logScrapingOperation(source, scrapedJobs.length, scrapeDuration);

      // Convert and save jobs
      let savedCount = 0;
      for (const scrapedJob of scrapedJobs) {
        try {
          const jobData: Prisma.JobCreateInput = {
            title: scrapedJob.title,
            company: scrapedJob.company,
            location: scrapedJob.location,
            applyLink: scrapedJob.applyLink,
            postedDate: scrapedJob.postedDate,
            salary: scrapedJob.salary,
            tags: scrapedJob.tags?.join(',') || '',
            source: source,
            status: 'ACTIVE',
            applied: false,
            dateScraped: new Date(),
            searchText: this.generateSearchText(scrapedJob)
          };

          await this.jobRepository.upsertJob(jobData);
          savedCount++;
        } catch (error) {
          this.logger.warn(`Failed to save job: ${scrapedJob.title}`, error);
        }
      }

      this.logger.log(`Successfully saved ${savedCount} jobs from ${source}`);
      return { scraped: scrapedJobs.length, saved: savedCount };
    } catch (error) {
      this.logger.error('Error during scraping and saving:', error);
      throw new Error('Failed to scrape and save jobs');
    }
  }

  // --- Analytics and Statistics ---

  async getJobStats(): Promise<JobStats> {
    try {
      const stats = await this.jobRepository.getJobStats();
      const allJobs = await this.jobRepository.getJobs();
      
      const jobStats: JobStats = {
        total: stats.total,
        applied: stats.applied,
        active: stats.notApplied, // This might need adjustment based on your logic
        byStatus: stats.byStatus as Record<JobStatus, number>,
        byCompany: {},
        byLocation: {}
      };

      // Count by company
      allJobs.forEach(job => {
        jobStats.byCompany[job.company] = (jobStats.byCompany[job.company] || 0) + 1;
      });

      // Count by location
      allJobs.forEach(job => {
        jobStats.byLocation[job.location] = (jobStats.byLocation[job.location] || 0) + 1;
      });

      return jobStats;
    } catch (error) {
      this.logger.error('Error getting job stats:', error);
      throw new Error('Failed to get job statistics');
    }
  }

  // --- Bulk Operations ---

  async bulkUpdateStatus(jobIds: number[], status: JobStatus): Promise<number> {
    try {
      let updatedCount = 0;
      
      for (const id of jobIds) {
        try {
          await this.updateApplicationStatus(id, status);
          updatedCount++;
        } catch (error) {
          this.logger.warn(`Failed to update job ${id}:`, error);
        }
      }

      this.logger.log(`Bulk updated ${updatedCount} jobs to status: ${status}`);
      return updatedCount;
    } catch (error) {
      this.logger.error('Error in bulk update:', error);
      throw new Error('Failed to bulk update jobs');
    }
  }

  // --- Utility Methods ---

  private generateSearchText(jobData: any): string {
    const searchableFields = [
      jobData.title,
      jobData.company,
      jobData.location,
      jobData.tags,
      jobData.salary,
      jobData.postedDate
    ].filter(Boolean);

    return searchableFields.join(' ').toLowerCase();
  }

  async findDuplicateJobs(jobData: Prisma.JobCreateInput): Promise<Job[]> {
    try {
      // Look for jobs with the same apply link or similar title/company
      const filters: JobFilter = {
        company: jobData.company,
        searchText: jobData.title
      };

      return await this.jobRepository.getJobs(filters);
    } catch (error) {
      this.logger.error('Error finding duplicate jobs:', error);
      throw new Error('Failed to find duplicate jobs');
    }
  }
} 