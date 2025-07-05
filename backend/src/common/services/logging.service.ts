import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  log(message: string, context?: any) {
    this.logger.log({
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  error(message: string, error?: any, context?: any) {
    this.logger.error({
      message,
      error: error?.message || error,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  warn(message: string, context?: any) {
    this.logger.warn({
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  debug(message: string, context?: any) {
    this.logger.debug({
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: any) {
    this.logger.log({
      message: 'Performance metric',
      operation,
      duration: `${duration}ms`,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration?: number, context?: any) {
    this.logger.log({
      message: 'Database operation',
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Scraping operation logging
  logScrapingOperation(source: string, jobsFound: number, duration?: number, context?: any) {
    this.logger.log({
      message: 'Scraping operation completed',
      source,
      jobsFound,
      duration: duration ? `${duration}ms` : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  }
} 