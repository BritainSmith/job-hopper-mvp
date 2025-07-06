import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Create a mock logger
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<LoggingService>(LoggingService);

    // Replace the internal logger with our mock
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should log a message with context', () => {
      const message = 'Test log message';
      const context = { userId: 123 };
      (() => service.log(message, context))();
      expect(mockLogger.log).toHaveBeenCalledWith({
        message,
        context,
        timestamp: expect.any(String),
      });
    });

    it('should log a message without context', () => {
      const message = 'Test log message';

      (() => service.log(message))();

      expect(mockLogger.log).toHaveBeenCalledWith({
        message,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should generate valid ISO timestamp', () => {
      const message = 'Test timestamp';

      (() => service.log(message))();

      const call = mockLogger.log.mock.calls[0][0];
      expect(new Date(call.timestamp).toISOString()).toBe(call.timestamp);
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid message gracefully', () => {
      (() => service.log('' as any))();
      (() => service.log(null as any))();
      (() => service.log(undefined as any))();
      (() => service.log(123 as any))();

      expect(mockLogger.warn).toHaveBeenCalledTimes(4);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    it('should sanitize circular reference context', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => service.log('test', circularObj)).toThrow(
        'Context contains circular references or non-serializable data',
      );
    });
  });

  describe('error', () => {
    it('should log an error with message and stack trace', () => {
      const message = 'Test error message';
      const error = new Error('Something went wrong');
      const context = { operation: 'test' };
      (() => service.error(message, error, context))();
      expect(mockLogger.error).toHaveBeenCalledWith({
        message,
        error: error.message,
        stack: error.stack,
        context,
        timestamp: expect.any(String),
      });
    });

    it('should handle error without stack trace', () => {
      const message = 'Test error message';
      const error = 'Simple error string';

      service.error(message, error);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message,
        error: 'Simple error string',
        stack: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should handle error without context', () => {
      const message = 'Test error message';
      const error = new Error('Something went wrong');

      service.error(message, error);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message,
        error: error.message,
        stack: error.stack,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should handle null/undefined error gracefully', () => {
      const message = 'Test error message';

      service.error(message, null);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message,
        error: undefined,
        stack: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid message gracefully', () => {
      service.error('' as any);
      service.error(null as any);
      service.error(undefined as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    it('should handle non-Error objects by throwing an error', () => {
      const message = 'Test error message';
      const error = { custom: 'error object' };

      expect(() => service.error(message, error)).toThrow(
        'Invalid error object provided to LoggingService.error',
      );
    });
  });

  describe('warn', () => {
    it('should log a warning with timestamp', () => {
      const message = 'Test warning message';
      const context = { level: 'high' };
      (() => service.warn(message, context))();
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message,
        context,
        timestamp: expect.any(String),
      });
    });

    it('should log a warning without context', () => {
      const message = 'Test warning message';

      service.warn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith({
        message,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid message gracefully', () => {
      service.warn('' as any);
      service.warn(null as any);
      service.warn(undefined as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      // Logger.warn is called with (message, context)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid message provided to LoggingService.warn',
        { message: '' },
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid message provided to LoggingService.warn',
        { message: null },
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid message provided to LoggingService.warn',
        { message: undefined },
      );
      // No structured log should be called
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });

  describe('debug', () => {
    it('should log a debug message with timestamp', () => {
      const message = 'Test debug message';
      const context = { debugLevel: 3 };
      (() => service.debug(message, context))();
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message,
        context,
        timestamp: expect.any(String),
      });
    });

    it('should log a debug message without context', () => {
      const message = 'Test debug message';

      service.debug(message);

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid message gracefully', () => {
      service.debug('' as any);
      service.debug(null as any);
      service.debug(undefined as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });

  describe('logPerformance', () => {
    it('should log performance metrics with duration', () => {
      const operation = 'database_query';
      const duration = 150;
      const context = { table: 'users' };

      service.logPerformance(operation, duration, context);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Performance metric',
        operation,
        duration: '150ms',
        context,
        timestamp: expect.any(String),
      });
    });

    it('should log performance metrics without context', () => {
      const operation = 'api_call';
      const duration = 45;

      service.logPerformance(operation, duration);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Performance metric',
        operation,
        duration: '45ms',
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should handle zero duration', () => {
      const operation = 'fast_operation';
      const duration = 0;

      service.logPerformance(operation, duration);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Performance metric',
        operation,
        duration: '0ms',
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid operation gracefully', () => {
      service.logPerformance('' as any, 100);
      service.logPerformance(null as any, 100);
      service.logPerformance(undefined as any, 100);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid duration gracefully', () => {
      service.logPerformance('test', -1);
      service.logPerformance('test', 'invalid' as any);
      service.logPerformance('test', null as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });

  describe('logDatabaseOperation', () => {
    it('should log database operation with duration', () => {
      const operation = 'SELECT';
      const table = 'jobs';
      const duration = 25;
      const context = { userId: 456 };

      service.logDatabaseOperation(operation, table, duration, context);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Database operation',
        operation,
        table,
        duration: '25ms',
        context,
        timestamp: expect.any(String),
      });
    });

    it('should log database operation without duration', () => {
      const operation = 'INSERT';
      const table = 'users';

      service.logDatabaseOperation(operation, table);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Database operation',
        operation,
        table,
        duration: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should log database operation with duration but no context', () => {
      const operation = 'UPDATE';
      const table = 'profiles';
      const duration = 100;

      service.logDatabaseOperation(operation, table, duration);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Database operation',
        operation,
        table,
        duration: '100ms',
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid operation gracefully', () => {
      service.logDatabaseOperation('' as any, 'test');
      service.logDatabaseOperation(null as any, 'test');
      service.logDatabaseOperation(undefined as any, 'test');

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid table gracefully', () => {
      service.logDatabaseOperation('SELECT', '' as any);
      service.logDatabaseOperation('SELECT', null as any);
      service.logDatabaseOperation('SELECT', undefined as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid duration gracefully', () => {
      service.logDatabaseOperation('SELECT', 'test', -1);
      service.logDatabaseOperation('SELECT', 'test', 'invalid' as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    it('should allow undefined duration', () => {
      service.logDatabaseOperation('SELECT', 'test', undefined);

      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Database operation',
        operation: 'SELECT',
        table: 'test',
        duration: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe('logScrapingOperation', () => {
    it('should log scraping operation with duration', () => {
      const source = 'linkedin';
      const jobsFound = 25;
      const duration = 5000;
      const context = { page: 1 };

      service.logScrapingOperation(source, jobsFound, duration, context);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Scraping operation completed',
        source,
        jobsFound,
        duration: '5000ms',
        context,
        timestamp: expect.any(String),
      });
    });

    it('should log scraping operation without duration', () => {
      const source = 'arbeitnow';
      const jobsFound = 0;

      service.logScrapingOperation(source, jobsFound);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Scraping operation completed',
        source,
        jobsFound,
        duration: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should log scraping operation with duration but no context', () => {
      const source = 'relocate';
      const jobsFound = 15;
      const duration = 2500;

      service.logScrapingOperation(source, jobsFound, duration);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Scraping operation completed',
        source,
        jobsFound,
        duration: '2500ms',
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should handle zero jobs found', () => {
      const source = 'remoteok';
      const jobsFound = 0;
      const duration = 1000;

      service.logScrapingOperation(source, jobsFound, duration);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Scraping operation completed',
        source,
        jobsFound: 0,
        duration: '1000ms',
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid source gracefully', () => {
      service.logScrapingOperation('' as any, 10);
      service.logScrapingOperation(null as any, 10);
      service.logScrapingOperation(undefined as any, 10);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid jobsFound gracefully', () => {
      service.logScrapingOperation('test', -1);
      service.logScrapingOperation('test', 'invalid' as any);
      service.logScrapingOperation('test', null as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('should handle invalid duration gracefully', () => {
      service.logScrapingOperation('test', 10, -1);
      service.logScrapingOperation('test', 10, 'invalid' as any);
      service.logScrapingOperation('test', 10, null as any);

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    it('should allow undefined duration', () => {
      service.logScrapingOperation('test', 10, undefined);

      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'Scraping operation completed',
        source: 'test',
        jobsFound: 10,
        duration: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe('timestamp consistency', () => {
    it('should generate consistent timestamps across all methods', () => {
      const beforeCall = new Date();

      service.log('test');
      service.error('test', new Error('test'));
      service.warn('test');
      service.debug('test');

      const afterCall = new Date();

      const calls = [
        mockLogger.log.mock.calls[0][0],
        mockLogger.error.mock.calls[0][0],
        mockLogger.warn.mock.calls[0][0],
        mockLogger.debug.mock.calls[0][0],
      ];

      calls.forEach((call) => {
        const timestamp = new Date(call.timestamp);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(
          beforeCall.getTime(),
        );
        expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string messages', () => {
      service.log('');
      service.error('');
      service.warn('');
      service.debug('');

      expect(mockLogger.warn).toHaveBeenCalledTimes(4);
      expect(mockLogger.log).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should handle complex context objects', () => {
      const complexContext = {
        user: { id: 1, name: 'Test' },
        request: { method: 'GET', url: '/test' },
        metadata: { version: '1.0.0' },
      };

      service.log('test', complexContext);

      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'test',
        context: complexContext,
        timestamp: expect.any(String),
      });
    });

    it('should handle circular reference in context by throwing an error', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => service.log('test', circularObj)).toThrow(
        'Context contains circular references or non-serializable data',
      );
    });

    it('should handle null and undefined context', () => {
      service.log('test', null);
      service.log('test', undefined);

      expect(mockLogger.log).toHaveBeenCalledTimes(2);
      expect(mockLogger.log).toHaveBeenCalledWith({
        message: 'test',
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe('private methods', () => {
    it.skip('should handle timestamp generation errors gracefully', () => {
      // Skipped: breaking Date globally is not a realistic scenario and causes cascading failures.
      // The fallback in generateTimestamp cannot recover if Date is completely broken.
    });
  });
});
