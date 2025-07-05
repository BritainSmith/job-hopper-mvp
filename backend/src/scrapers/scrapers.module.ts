import { Module } from '@nestjs/common';
import { ScraperFactory } from './scraper-factory';
import { RemoteOKScraper } from './remoteok/remoteok-scraper';
import { RemoteOKV1Parser } from './remoteok/v1/remoteok-v1.parser';

@Module({
  providers: [ScraperFactory, RemoteOKScraper, RemoteOKV1Parser],
  exports: [ScraperFactory, RemoteOKScraper],
})
export class ScrapersModule {}
