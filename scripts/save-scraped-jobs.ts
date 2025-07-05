#!/usr/bin/env ts-node

import { jobService } from '../src/services';
import { JobListing } from '../src/scrapers/remoteok';
import fs from 'fs';
import path from 'path';

async function saveScrapedJobs() {
  console.log('💾 Loading and saving scraped jobs to database...\n');

  try {
    // Read the scraped jobs from JSON file
    const jsonPath = path.join(process.cwd(), 'remoteok-jobs.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ No scraped jobs file found. Please run the scraper first.');
      return;
    }

    const scrapedJobs: JobListing[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📄 Found ${scrapedJobs.length} jobs in scraped file`);

    if (scrapedJobs.length === 0) {
      console.log('⚠️ No jobs to save');
      return;
    }

    // Convert to Prisma format and save
    const jobInputs = scrapedJobs.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      applyLink: job.applyLink,
      postedDate: job.postedDate,
      salary: job.salary,
      tags: job.tags ? JSON.stringify(job.tags) : null,
      source: 'remoteok'
    }));

    console.log('💾 Saving jobs to database...');
    const result = await jobService.bulkUpsertJobs(jobInputs);
    
    console.log(`✅ Successfully saved ${result.created} new jobs, ${result.updated} updated`);

    // Display saved jobs
    console.log('\n📋 Saved Jobs:');
    const savedJobs = await jobService.searchJobs({ pagination: { take: 10 } });
    savedJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Posted: ${job.postedDate}`);
      console.log(`   Tags: ${job.tags || 'None'}`);
      console.log(`   Status: ${job.status}`);
      console.log('');
    });

    // Show database stats
    const stats = await jobService.getJobStats();
    console.log('📊 Database Statistics:');
    console.log(`Total jobs: ${stats.total}`);
    console.log(`Active jobs: ${stats.active}`);
    console.log(`Applied jobs: ${stats.applied}`);

  } catch (error) {
    console.error('❌ Error saving jobs:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  saveScrapedJobs()
    .then(() => {
      console.log('\n🎉 Jobs saved successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to save jobs:', error);
      process.exit(1);
    });
} 