#!/usr/bin/env ts-node

import { jobService, scraperService } from '../src/services';

async function testServices() {
  console.log('🧪 Testing Service Layer...\n');

  try {
    // Test 1: Create a sample job
    console.log('1️⃣ Testing job creation...');
    const sampleJob = await jobService.createJob({
      title: 'Senior TypeScript Developer',
      company: 'TechCorp',
      location: 'Remote',
      applyLink: 'https://example.com/job/123',
      postedDate: '2d ago',
      salary: '$120k - $150k',
      tags: JSON.stringify(['TypeScript', 'React', 'Node.js']),
      source: 'test'
    });
    console.log('✅ Job created:', sampleJob.title);

    // Test 2: Search jobs
    console.log('\n2️⃣ Testing job search...');
    const searchResults = await jobService.searchJobs({
      query: 'TypeScript',
      pagination: { take: 10 }
    });
    console.log(`✅ Found ${searchResults.length} jobs matching "TypeScript"`);

    // Test 3: Get job statistics
    console.log('\n3️⃣ Testing job statistics...');
    const stats = await jobService.getJobStats();
    console.log('✅ Job stats:', {
      total: stats.total,
      active: stats.active,
      applied: stats.applied
    });

    // Test 4: Apply to a job
    console.log('\n4️⃣ Testing job application...');
    const updatedJob = await jobService.applyToJob(sampleJob.id, {
      status: 'APPLIED',
      appliedAt: new Date()
    });
    console.log('✅ Applied to job:', updatedJob.title);

    // Test 5: Test scraping service (without saving to DB)
    console.log('\n5️⃣ Testing scraping service...');
    const scrapingResults = await scraperService.scrapeJobs({
      maxPages: 1,
      headless: true,
      saveToDatabase: false // Don't save for testing
    });
    console.log('✅ Scraping completed:', scrapingResults);

    // Test 6: Get scraping stats
    console.log('\n6️⃣ Testing scraping statistics...');
    const scrapingStats = await scraperService.getScrapingStats();
    console.log('✅ Scraping stats:', scrapingStats);

    console.log('\n🎉 All service tests passed!');

  } catch (error) {
    console.error('❌ Service test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testServices()
    .then(() => {
      console.log('\n✅ Service layer is working correctly!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Service layer test failed:', error);
      process.exit(1);
    });
} 