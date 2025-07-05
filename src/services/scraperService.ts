import { scrapeRemoteOKJobs, JobListing as ScrapedJob } from '../scrapers/remoteok';
import { jobService } from './jobService';
import { Job, JobStatus, Prisma } from '@prisma/client';

// --- Service Types ---

export interface ScrapingResult {
  source: string;
  totalFound: number;
  newJobs: number;
  updatedJobs: number;
  errors: string[];
  duration: number;
}

export interface ScrapingOptions {
  sources?: string[];
  maxPages?: number;
  delay?: number;
  headless?: boolean;
  saveToDatabase?: boolean;
}

export interface AutomationOptions {
  autoApply?: boolean;
  applyToKeywords?: string[];
  skipKeywords?: string[];
  maxApplicationsPerDay?: number;
  resumePath?: string;
}

// --- Scraper Service ---

export class ScraperService {
  private dailyApplicationCount = 0;
  private lastApplicationReset = new Date();

  // --- Core Scraping ---

  async scrapeJobs(options: ScrapingOptions = {}): Promise<ScrapingResult[]> {
    const startTime = Date.now();
    const results: ScrapingResult[] = [];

    try {
      console.log('🚀 Starting job scraping...');

      // Scrape from RemoteOK
      if (!options.sources || options.sources.includes('remoteok')) {
        const remoteOKResult = await this.scrapeRemoteOK(options);
        results.push(remoteOKResult);
      }

      // TODO: Add more scrapers here (LinkedIn, Indeed, etc.)
      // if (!options.sources || options.sources.includes('linkedin')) {
      //   const linkedInResult = await this.scrapeLinkedIn(options);
      //   results.push(linkedInResult);
      // }

      const totalDuration = Date.now() - startTime;
      console.log(`✅ Scraping completed in ${totalDuration}ms`);

      return results;
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw new Error('Failed to scrape jobs');
    }
  }

  private async scrapeRemoteOK(options: ScrapingOptions): Promise<ScrapingResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      console.log('📄 Scraping RemoteOK...');

      // Scrape jobs from RemoteOK
      const scrapedJobs = await scrapeRemoteOKJobs({
        maxPages: options.maxPages,
        delay: options.delay,
        headless: options.headless
      });

      let newJobs = 0;
      let updatedJobs = 0;

      // Save to database if requested
      if (options.saveToDatabase !== false) {
        const result = await this.saveScrapedJobs(scrapedJobs, 'remoteok');
        newJobs = result.created;
        updatedJobs = result.updated;
      }

      const duration = Date.now() - startTime;

      return {
        source: 'remoteok',
        totalFound: scrapedJobs.length,
        newJobs,
        updatedJobs,
        errors,
        duration
      };
    } catch (error) {
      console.error('❌ RemoteOK scraping failed:', error);
      return {
        source: 'remoteok',
        totalFound: 0,
        newJobs: 0,
        updatedJobs: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      };
    }
  }

  // --- Database Integration ---

  private async saveScrapedJobs(scrapedJobs: ScrapedJob[], source: string): Promise<{ created: number; updated: number }> {
    try {
      console.log(`💾 Saving ${scrapedJobs.length} jobs to database...`);

      // Convert scraped jobs to Prisma format
      const jobInputs: Prisma.JobCreateInput[] = scrapedJobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        applyLink: job.applyLink,
        postedDate: job.postedDate,
        salary: job.salary,
        tags: job.tags ? JSON.stringify(job.tags) : null,
        source,
        searchText: this.generateSearchText(job)
      }));

      // Use bulk upsert to handle duplicates
      const result = await jobService.bulkUpsertJobs(jobInputs);
      
      console.log(`✅ Saved ${result.created} new jobs, ${result.updated} updated`);
      return result;
    } catch (error) {
      console.error('❌ Failed to save jobs:', error);
      throw error;
    }
  }

  // --- Automation Features ---

  async automateJobSearch(options: AutomationOptions = {}): Promise<void> {
    try {
      console.log('🤖 Starting automated job search...');

      // Reset daily application count if it's a new day
      this.resetDailyApplicationCount();

      // Scrape new jobs
      const scrapingResults = await this.scrapeJobs({ saveToDatabase: true });

      // Get active jobs that match criteria
      const activeJobs = await jobService.getActiveJobs();
      const matchingJobs = this.filterJobsForAutomation(activeJobs, options);

      console.log(`🎯 Found ${matchingJobs.length} jobs matching automation criteria`);

      // Apply to matching jobs if automation is enabled
      if (options.autoApply && matchingJobs.length > 0) {
        await this.automateApplications(matchingJobs, options);
      }

      console.log('✅ Automated job search completed');
    } catch (error) {
      console.error('❌ Automated job search failed:', error);
      throw error;
    }
  }

  private filterJobsForAutomation(jobs: Job[], options: AutomationOptions): Job[] {
    return jobs.filter(job => {
      // Check if we've reached daily application limit
      if (options.maxApplicationsPerDay && this.dailyApplicationCount >= options.maxApplicationsPerDay) {
        return false;
      }

      const jobText = `${job.title} ${job.company} ${job.tags || ''}`.toLowerCase();

      // Skip if job contains skip keywords
      if (options.skipKeywords) {
        for (const keyword of options.skipKeywords) {
          if (jobText.includes(keyword.toLowerCase())) {
            return false;
          }
        }
      }

      // Include if job contains apply keywords (or include all if no keywords specified)
      if (options.applyToKeywords && options.applyToKeywords.length > 0) {
        for (const keyword of options.applyToKeywords) {
          if (jobText.includes(keyword.toLowerCase())) {
            return true;
          }
        }
        return false; // No keywords matched
      }

      return true; // Include all jobs if no keywords specified
    });
  }

  private async automateApplications(jobs: Job[], options: AutomationOptions): Promise<void> {
    console.log(`📝 Automating applications for ${jobs.length} jobs...`);

    for (const job of jobs) {
      try {
        // Check daily limit
        if (options.maxApplicationsPerDay && this.dailyApplicationCount >= options.maxApplicationsPerDay) {
          console.log('⚠️ Daily application limit reached');
          break;
        }

        // Apply to job
        await jobService.applyToJob(job.id, {
          status: 'APPLIED',
          appliedAt: new Date()
        });

        this.dailyApplicationCount++;
        console.log(`✅ Applied to: ${job.title} at ${job.company}`);

        // TODO: Implement actual resume submission
        // await this.submitResume(job, options.resumePath);

        // Add delay between applications to be respectful
        await this.delay(5000); // 5 seconds between applications

      } catch (error) {
        console.error(`❌ Failed to apply to job ${job.id}:`, error);
      }
    }
  }

  // --- Resume Submission (Placeholder for future implementation) ---

  async submitResume(job: Job, resumePath?: string): Promise<boolean> {
    try {
      console.log(`📄 Submitting resume for: ${job.title} at ${job.company}`);
      
      // TODO: Implement actual resume submission logic
      // This could involve:
      // - Filling out application forms
      // - Uploading resume
      // - Submitting cover letters
      // - Handling different application systems

      // For now, just mark as applied
      await jobService.updateApplicationStatus(job.id, 'APPLIED');
      
      return true;
    } catch (error) {
      console.error('❌ Resume submission failed:', error);
      return false;
    }
  }

  // --- Analytics and Monitoring ---

  async getScrapingStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    appliedJobs: number;
    dailyApplications: number;
    lastScrapingRun?: Date;
  }> {
    try {
      const stats = await jobService.getJobStats();
      
      return {
        totalJobs: stats.total,
        activeJobs: stats.active,
        appliedJobs: stats.applied,
        dailyApplications: this.dailyApplicationCount,
        lastScrapingRun: new Date() // TODO: Store and retrieve actual last run time
      };
    } catch (error) {
      console.error('❌ Failed to get scraping stats:', error);
      throw error;
    }
  }

  // --- Utility Methods ---

  private generateSearchText(job: ScrapedJob): string {
    const parts = [
      job.title,
      job.company,
      job.location,
      job.tags?.join(' '),
      job.salary
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  private resetDailyApplicationCount(): void {
    const now = new Date();
    const lastReset = this.lastApplicationReset;
    
    // Reset if it's a new day
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      this.dailyApplicationCount = 0;
      this.lastApplicationReset = now;
      console.log('🔄 Daily application count reset');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const scraperService = new ScraperService(); 