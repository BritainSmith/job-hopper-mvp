import { Module } from '@nestjs/common';
import { ScraperFactory } from './scraper-factory';
import { RemoteOKScraper } from './remoteok/remoteok-scraper';
import { RemoteOKV1Parser } from './remoteok/v1/remoteok-v1.parser';
import { LinkedInScraper } from './linkedin/linkedin-scraper';
import { LinkedInV1Parser } from './linkedin/v1/linkedin-v1.parser';
import { ArbeitnowScraper } from './arbeitnow/arbeitnow-scraper';
import { ArbeitnowV1Parser } from './arbeitnow/v1/arbeitnow-v1.parser';
import { RelocateScraper } from './relocate/relocate-scraper';
import { RelocateV1Parser } from './relocate/v1/relocate-v1.parser';

@Module({
  providers: [
    ScraperFactory,
    RemoteOKScraper,
    RemoteOKV1Parser,
    LinkedInScraper,
    LinkedInV1Parser,
    ArbeitnowScraper,
    ArbeitnowV1Parser,
    RelocateScraper,
    RelocateV1Parser,
  ],
  exports: [
    ScraperFactory,
    RemoteOKScraper,
    LinkedInScraper,
    ArbeitnowScraper,
    RelocateScraper,
  ],
})
export class ScrapersModule {}
