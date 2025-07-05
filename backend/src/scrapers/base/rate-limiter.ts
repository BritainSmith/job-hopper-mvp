import { Injectable, Logger } from '@nestjs/common';
import { RateLimitConfig } from './interfaces';

@Injectable()
export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // Reset every minute

  constructor(private config: RateLimitConfig) {}

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Check rate limit
      await this.checkRateLimit();

      const request = this.queue.shift();
      if (request) {
        const startTime = Date.now();
        try {
          await request();
          this.recordRequest(Date.now() - startTime, true);
        } catch (error) {
          this.recordRequest(Date.now() - startTime, false);
          this.logger.error('Request failed:', error);
        }

        // Add delay between requests
        const delay = this.getRandomDelay();
        await this.sleep(delay);
      }
    }
    this.processing = false;
  }

  private async checkRateLimit() {
    const now = Date.now();

    // Reset counter if minute has passed
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000;
    }

    // Check if we're at the limit
    if (this.requestCount >= this.config.requestsPerMinute) {
      const waitTime = this.resetTime - now;
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }
  }

  private recordRequest(duration: number, success: boolean) {
    this.requestCount++;
    this.lastRequestTime = Date.now();

    if (success) {
      this.logger.debug(`Request completed in ${duration}ms`);
    } else {
      this.logger.warn(`Request failed after ${duration}ms`);
    }
  }

  private getRandomDelay(): number {
    const { min, max } = this.config.delayBetweenRequests;
    return Math.random() * (max - min) + min;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getMetrics() {
    return {
      queueLength: this.queue.length,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      resetTime: this.resetTime,
    };
  }
}
