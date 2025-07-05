#!/usr/bin/env ts-node

import { scrapeJobs } from '../src/scrapers/dynamicScraper';
import { getAvailableScrapers } from '../src/config/scrapers';

async function testDynamicScraper() {
  console.log('🧪 Testing Dynamic Scraper...\n');

  try {
    // Show available scrapers
    const availableScrapers = getAvailableScrapers();
    console.log('📋 Available scrapers:', availableScrapers);

    // Test RemoteOK scraper with improved company name extraction
    console.log('\n1️⃣ Testing RemoteOK scraper with dynamic configuration...');
    
    const jobs = await scrapeJobs('remoteok', {
      maxPages: 1,
      headless: false
    });

    console.log(`✅ Found ${jobs.length} jobs`);

    if (jobs.length > 0) {
      console.log('\n📋 Sample jobs with improved extraction:');
      jobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Posted: ${job.postedDate}`);
        console.log(`   Tags: ${job.tags?.join(', ') || 'None'}`);
        console.log('');
      });

      // Check if company names are improved
      const shortCompanyNames = jobs.filter(job => job.company.length <= 3);
      if (shortCompanyNames.length > 0) {
        console.log('⚠️ Still found some short company names:');
        shortCompanyNames.forEach(job => {
          console.log(`   - ${job.company} (${job.title})`);
        });
      } else {
        console.log('✅ All company names look good!');
      }
    }

    console.log('\n🎉 Dynamic scraper test completed!');

  } catch (error) {
    console.error('❌ Dynamic scraper test failed:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testDynamicScraper()
    .then(() => {
      console.log('\n✅ Dynamic scraper is working correctly!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Dynamic scraper test failed:', error);
      process.exit(1);
    });
} 