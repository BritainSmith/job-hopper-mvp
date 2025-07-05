#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDatabase() {
  console.log('🔍 Inspecting Database Contents...\n');

  try {
    // Get all jobs with detailed information
    const jobs = await prisma.job.findMany({
      orderBy: { dateScraped: 'desc' }
    });

    console.log(`📊 Total Jobs in Database: ${jobs.length}\n`);

    if (jobs.length === 0) {
      console.log('❌ No jobs found in database');
      return;
    }

    // Display each job with all fields
    jobs.forEach((job, index) => {
      console.log(`--- Job ${index + 1} ---`);
      console.log(`ID: ${job.id}`);
      console.log(`Title: ${job.title}`);
      console.log(`Company: ${job.company}`);
      console.log(`Location: ${job.location}`);
      console.log(`Apply Link: ${job.applyLink}`);
      console.log(`Posted Date: ${job.postedDate}`);
      console.log(`Salary: ${job.salary || 'Not specified'}`);
      console.log(`Tags: ${job.tags || 'None'}`);
      console.log(`Source: ${job.source}`);
      console.log(`Applied: ${job.applied}`);
      console.log(`Applied At: ${job.appliedAt || 'Not applied'}`);
      console.log(`Status: ${job.status}`);
      console.log(`Date Scraped: ${job.dateScraped}`);
      console.log(`Last Updated: ${job.lastUpdated}`);
      console.log(`Search Text: ${job.searchText?.substring(0, 100)}${job.searchText && job.searchText.length > 100 ? '...' : ''}`);
      console.log(`Company ID: ${job.companyId || 'None'}`);
      console.log('');
    });

    // Check for any data consistency issues
    console.log('🔍 Data Consistency Check:');
    
    // Check for duplicate apply links
    const applyLinks = jobs.map(job => job.applyLink);
    const duplicateLinks = applyLinks.filter((link, index) => applyLinks.indexOf(link) !== index);
    if (duplicateLinks.length > 0) {
      console.log(`⚠️ Found ${duplicateLinks.length} duplicate apply links`);
    } else {
      console.log('✅ No duplicate apply links found');
    }

    // Check for missing required fields
    const jobsWithMissingFields = jobs.filter(job => 
      !job.title || !job.company || !job.applyLink
    );
    if (jobsWithMissingFields.length > 0) {
      console.log(`⚠️ Found ${jobsWithMissingFields.length} jobs with missing required fields`);
    } else {
      console.log('✅ All jobs have required fields');
    }

    // Check for malformed JSON in tags
    const jobsWithMalformedTags = jobs.filter(job => {
      if (!job.tags) return false;
      try {
        JSON.parse(job.tags);
        return false;
      } catch {
        return true;
      }
    });
    if (jobsWithMalformedTags.length > 0) {
      console.log(`⚠️ Found ${jobsWithMalformedTags.length} jobs with malformed tag JSON`);
    } else {
      console.log('✅ All tag JSON is valid');
    }

    // Show statistics by source
    const sourceStats = jobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Jobs by Source:');
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} jobs`);
    });

    // Show statistics by status
    const statusStats = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Jobs by Status:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} jobs`);
    });

    // Show unique companies
    const uniqueCompanies = [...new Set(jobs.map(job => job.company))];
    console.log(`\n🏢 Unique Companies: ${uniqueCompanies.length}`);
    uniqueCompanies.forEach(company => {
      const companyJobs = jobs.filter(job => job.company === company);
      console.log(`  ${company}: ${companyJobs.length} jobs`);
    });

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  inspectDatabase()
    .then(() => {
      console.log('\n✅ Database inspection completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database inspection failed:', error);
      process.exit(1);
    });
} 