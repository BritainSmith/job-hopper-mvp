import { jobRepository, JobFilter, PaginationOptions } from '../db/jobRepository';
import { Job, JobStatus, Prisma } from '@prisma/client';

// --- Service Types ---

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

// --- Job Service ---

export class JobService {
  // --- CRUD Operations ---

  async createJob(jobData: Prisma.JobCreateInput): Promise<Job> {
    try {
      // Add searchable text for better search
      const searchText = this.generateSearchText(jobData);
      const jobWithSearch = { ...jobData, searchText };
      
      return await jobRepository.createJob(jobWithSearch);
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  async getJobById(id: number): Promise<Job | null> {
    try {
      return await jobRepository.getJobById(id);
    } catch (error) {
      console.error('Error fetching job:', error);
      throw new Error('Failed to fetch job');
    }
  }

  async updateJob(id: number, updateData: Prisma.JobUpdateInput): Promise<Job> {
    try {
      // Update search text if relevant fields changed
      if (updateData.title || updateData.company || updateData.tags) {
        const existingJob = await jobRepository.getJobById(id);
        if (existingJob) {
          const updatedData = { ...existingJob, ...updateData };
          updateData.searchText = this.generateSearchText(updatedData);
        }
      }
      
      return await jobRepository.updateJob(id, updateData);
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error('Failed to update job');
    }
  }

  async deleteJob(id: number): Promise<Job> {
    try {
      return await jobRepository.deleteJob(id);
    } catch (error) {
      console.error('Error deleting job:', error);
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

      return await jobRepository.getJobs(filters, finalPagination);
    } catch (error) {
      console.error('Error searching jobs:', error);
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
      console.error('Error applying to job:', error);
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
      console.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

  // --- Analytics and Statistics ---

  async getJobStats(): Promise<JobStats> {
    try {
      const allJobs = await jobRepository.getJobs();
      
      const stats: JobStats = {
        total: allJobs.length,
        applied: allJobs.filter(job => job.applied).length,
        active: allJobs.filter(job => job.status === 'ACTIVE').length,
        byStatus: {} as Record<JobStatus, number>,
        byCompany: {},
        byLocation: {}
      };

      // Count by status
      Object.values(JobStatus).forEach(status => {
        stats.byStatus[status] = allJobs.filter(job => job.status === status).length;
      });

      // Count by company
      allJobs.forEach(job => {
        stats.byCompany[job.company] = (stats.byCompany[job.company] || 0) + 1;
      });

      // Count by location
      allJobs.forEach(job => {
        stats.byLocation[job.location] = (stats.byLocation[job.location] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw new Error('Failed to get job statistics');
    }
  }

  // --- Bulk Operations ---

  async bulkUpsertJobs(jobs: Prisma.JobCreateInput[]): Promise<{ created: number; updated: number }> {
    try {
      let created = 0;
      let updated = 0;

      for (const jobData of jobs) {
        try {
          const searchText = this.generateSearchText(jobData);
          const jobWithSearch = { ...jobData, searchText };
          
          await jobRepository.upsertJob(jobWithSearch);
          created++; // upsert creates if not exists
        } catch (error) {
          console.warn('Error upserting job:', error);
        }
      }

      return { created, updated };
    } catch (error) {
      console.error('Error in bulk upsert:', error);
      throw new Error('Failed to bulk upsert jobs');
    }
  }

  async bulkUpdateStatus(jobIds: number[], status: JobStatus): Promise<number> {
    try {
      let updated = 0;
      
      for (const id of jobIds) {
        try {
          await this.updateApplicationStatus(id, status);
          updated++;
        } catch (error) {
          console.warn(`Error updating job ${id}:`, error);
        }
      }

      return updated;
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw new Error('Failed to bulk update job statuses');
    }
  }

  // --- Utility Methods ---

  private generateSearchText(jobData: any): string {
    const parts = [
      jobData.title,
      jobData.company,
      jobData.location,
      jobData.tags,
      jobData.salary
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  // --- Duplicate Detection ---

  async findDuplicateJobs(jobData: Prisma.JobCreateInput): Promise<Job[]> {
    try {
      // Check for duplicates based on title and company
      return await jobRepository.getJobs({
        company: jobData.company,
        searchText: jobData.title
      });
    } catch (error) {
      console.error('Error finding duplicates:', error);
      return [];
    }
  }
}

// Export singleton instance
export const jobService = new JobService(); 