import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  private generateTimestamp(): string {
    try {
      return new Date().toISOString();
    } catch {
      // Fallback in case Date operations fail
      return new Date().toString();
    }
  }

  private sanitizeContext(context: unknown): unknown {
    if (context === null || context === undefined) {
      return undefined;
    }

    try {
      // Try to serialize to check for circular references
      JSON.stringify(context);
      return context;
    } catch {
      // If serialization fails, return a safe representation
      return {
        error: 'Context contains circular references or non-serializable data',
      };
    }
  }

  log(message: string, context?: unknown) {
    if (!message || typeof message !== 'string') {
      this.logger.warn('Invalid message provided to LoggingService.log', {
        message,
      });
      return;
    }

    this.logger.log({
      message,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }

  error(message: string, error?: unknown, context?: unknown) {
    if (!message || typeof message !== 'string') {
      this.logger.warn('Invalid message provided to LoggingService.error', {
        message,
      });
      return;
    }

    let errorMessage: string | undefined;
    let stackTrace: string | undefined;

    if (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
        stackTrace = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = String(error);
      }
    }

    this.logger.error({
      message,
      error: errorMessage,
      stack: stackTrace,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }

  warn(message: string, context?: unknown) {
    if (!message || typeof message !== 'string') {
      this.logger.warn('Invalid message provided to LoggingService.warn', {
        message,
      });
      return;
    }

    this.logger.warn({
      message,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }

  debug(message: string, context?: unknown) {
    if (!message || typeof message !== 'string') {
      this.logger.warn('Invalid message provided to LoggingService.debug', {
        message,
      });
      return;
    }

    this.logger.debug({
      message,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: unknown) {
    if (!operation || typeof operation !== 'string') {
      this.logger.warn(
        'Invalid operation provided to LoggingService.logPerformance',
        { operation },
      );
      return;
    }

    if (typeof duration !== 'number' || duration < 0) {
      this.logger.warn(
        'Invalid duration provided to LoggingService.logPerformance',
        { duration },
      );
      return;
    }

    this.logger.log({
      message: 'Performance metric',
      operation,
      duration: `${duration}ms`,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    context?: unknown,
  ) {
    if (!operation || typeof operation !== 'string') {
      this.logger.warn(
        'Invalid operation provided to LoggingService.logDatabaseOperation',
        { operation },
      );
      return;
    }

    if (!table || typeof table !== 'string') {
      this.logger.warn(
        'Invalid table provided to LoggingService.logDatabaseOperation',
        { table },
      );
      return;
    }

    if (
      duration !== undefined &&
      (typeof duration !== 'number' || duration < 0)
    ) {
      this.logger.warn(
        'Invalid duration provided to LoggingService.logDatabaseOperation',
        { duration },
      );
      return;
    }

    this.logger.log({
      message: 'Database operation',
      operation,
      table,
      duration: duration !== undefined ? `${duration}ms` : undefined,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }

  // Scraping operation logging
  logScrapingOperation(
    source: string,
    jobsFound: number,
    duration?: number,
    context?: unknown,
  ) {
    if (!source || typeof source !== 'string') {
      this.logger.warn(
        'Invalid source provided to LoggingService.logScrapingOperation',
        { source },
      );
      return;
    }

    if (typeof jobsFound !== 'number' || jobsFound < 0) {
      this.logger.warn(
        'Invalid jobsFound provided to LoggingService.logScrapingOperation',
        { jobsFound },
      );
      return;
    }

    if (
      duration !== undefined &&
      (typeof duration !== 'number' || duration < 0)
    ) {
      this.logger.warn(
        'Invalid duration provided to LoggingService.logScrapingOperation',
        { duration },
      );
      return;
    }

    this.logger.log({
      message: 'Scraping operation completed',
      source,
      jobsFound,
      duration: duration !== undefined ? `${duration}ms` : undefined,
      context: this.sanitizeContext(context),
      timestamp: this.generateTimestamp(),
    });
  }
}
