import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createLoggerConfig, createServiceLogger } from './logger.config';

// Mock winston
jest.mock('winston', () => ({
  format: {
    combine: jest.fn().mockReturnValue('combined-format'),
    timestamp: jest.fn().mockReturnValue('timestamp-format'),
    errors: jest.fn().mockReturnValue('errors-format'),
    json: jest.fn().mockReturnValue('json-format'),
    printf: jest.fn(),
    colorize: jest.fn().mockReturnValue('colorize-format'),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  createLogger: jest.fn(),
}));

describe('Logger Configuration', () => {
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockConsoleTransport: jest.Mocked<any>;
  let mockFileTransport: jest.Mocked<any>;
  let mockWinstonLogger: jest.Mocked<any>;
  let mockPrintf: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn(),
    } as any;

    // Mock transports
    mockConsoleTransport = {
      constructor: jest.fn(),
    };
    mockFileTransport = {
      constructor: jest.fn(),
    };

    (winston.transports.Console as any) = jest.fn().mockImplementation(() => mockConsoleTransport);
    (winston.transports.File as any) = jest.fn().mockImplementation(() => mockFileTransport);

    // Mock winston.createLogger
    mockWinstonLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    (winston.createLogger as any) = jest.fn().mockReturnValue(mockWinstonLogger);

    // Mock printf function
    mockPrintf = jest.fn().mockImplementation((fn) => {
      // Store the function so we can test it
      mockPrintf.fn = fn;
      return 'printf-format';
    });
    (winston.format.printf as any) = mockPrintf;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createLoggerConfig', () => {
    it('should create logger config with development settings', () => {
      mockConfigService.get
        .mockReturnValueOnce('development') // NODE_ENV
        .mockReturnValueOnce('debug'); // LOG_LEVEL

      const config = createLoggerConfig(mockConfigService);

      expect(config).toBeDefined();
      expect(config.level).toBe('debug');
      expect(config.transports).toHaveLength(4); // console + 3 file transports
      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledTimes(3);
    });

    it('should create logger config with production settings', () => {
      mockConfigService.get
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('info'); // LOG_LEVEL

      const config = createLoggerConfig(mockConfigService);

      expect(config).toBeDefined();
      expect(config.level).toBe('info');
      expect(config.transports).toHaveLength(3); // console + 2 file transports (no debug)
      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledTimes(2);
    });

    it('should use default log level when not provided', () => {
      // Mock ConfigService to return undefined for LOG_LEVEL, which should trigger default
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'LOG_LEVEL') return defaultValue; // Return the default value when key is undefined
        return undefined;
      });

      const config = createLoggerConfig(mockConfigService);

      expect(config.level).toBe('info'); // Should use default 'info'
    });

    it('should configure console transport with colorized format', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      expect(winston.transports.Console).toHaveBeenCalledWith({
        format: 'combined-format',
      });
    });

    it('should configure file transports with correct settings', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Check error log file transport
      expect(winston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      // Check combined log file transport
      expect(winston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      // Check debug log file transport (development only)
      expect(winston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'logs/debug.log',
          level: 'debug',
          maxsize: 5242880, // 5MB
          maxFiles: 3,
        })
      );
    });

    it('should not include debug transport in production', () => {
      mockConfigService.get
        .mockReturnValueOnce('production')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Should only have 2 file transports (error + combined)
      const fileTransportCalls = (winston.transports.File as any).mock.calls;
      expect(fileTransportCalls).toHaveLength(2);
      
      // Check that debug transport is not included
      const debugTransportCall = fileTransportCalls.find(call => 
        call[0].filename === 'logs/debug.log'
      );
      expect(debugTransportCall).toBeUndefined();
    });

    it('should configure log format correctly', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
      expect(winston.format.json).toHaveBeenCalled();
      expect(winston.format.printf).toHaveBeenCalled();
    });

    it('should execute printf function for log format with stack trace', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Get the printf function that was called for log format
      const printfCalls = mockPrintf.mock.calls;
      expect(printfCalls.length).toBeGreaterThan(0);

      // Execute the printf function with stack trace
      const logFormatPrintf = printfCalls[0][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test.js:1:1',
        userId: 123,
        requestId: 'req-123'
      };

      const result = logFormatPrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test error');
      expect(result).toContain('req-123');
    });

    it('should execute printf function for log format without stack trace', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Get the printf function that was called for log format
      const printfCalls = mockPrintf.mock.calls;
      const logFormatPrintf = printfCalls[0][0];

      // Execute the printf function without stack trace
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test info',
        userId: 123,
        requestId: 'req-123'
      };

      const result = logFormatPrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test info');
      expect(result).toContain('req-123');
    });

    it('should execute printf function for console transport with meta data', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Get the printf function that was called for console transport
      const printfCalls = mockPrintf.mock.calls;
      expect(printfCalls.length).toBeGreaterThan(1);

      const consolePrintf = printfCalls[1][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message',
        userId: 123,
        requestId: 'req-123'
      };

      const result = consolePrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test message');
      expect(result).toContain('[info]');
    });

    it('should execute printf function for console transport with stack trace', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      const printfCalls = mockPrintf.mock.calls;
      const consolePrintf = printfCalls[1][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test.js:1:1',
        userId: 123
      };

      const result = consolePrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test error');
      expect(result).toContain('Error: Test error');
    });

    it('should execute printf function for console transport without meta data', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      const printfCalls = mockPrintf.mock.calls;
      const consolePrintf = printfCalls[1][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message'
      };

      const result = consolePrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test message');
      expect(result).not.toContain('{}');
    });
  });

  describe('createServiceLogger', () => {
    it('should create service logger with correct configuration', () => {
      const serviceName = 'TestService';
      const logger = createServiceLogger(serviceName);

      expect(logger).toBeDefined();
      expect(winston.createLogger).toHaveBeenCalledWith({
        format: 'combined-format',
        defaultMeta: { service: serviceName },
        transports: [
          mockConsoleTransport,
          mockFileTransport,
        ],
      });
    });

    it('should configure service logger with console transport', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      expect(winston.transports.Console).toHaveBeenCalledWith({
        format: 'combined-format',
      });
    });

    it('should configure service logger with file transport', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      expect(winston.transports.File).toHaveBeenCalledWith({
        filename: 'logs/combined.log',
        format: 'combined-format',
      });
    });

    it('should set default metadata with service name', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultMeta: { service: serviceName },
        })
      );
    });

    it('should configure format with timestamp and errors', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
      expect(winston.format.json).toHaveBeenCalled();
    });

    it('should create different loggers for different services', () => {
      const service1 = 'Service1';
      const service2 = 'Service2';

      const logger1 = createServiceLogger(service1);
      const logger2 = createServiceLogger(service2);

      expect(logger1).toBe(mockWinstonLogger);
      expect(logger2).toBe(mockWinstonLogger);
      expect(winston.createLogger).toHaveBeenCalledTimes(2);
    });

    it('should execute printf function for service logger console transport with service name', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      const printfCalls = mockPrintf.mock.calls;
      expect(printfCalls.length).toBeGreaterThan(0);

      const serviceConsolePrintf = printfCalls[printfCalls.length - 1][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message',
        service: serviceName,
        userId: 123
      };

      const result = serviceConsolePrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test message');
      expect(result).toContain(`[${serviceName}]`);
      expect(result).toContain('[info]');
    });

    it('should execute printf function for service logger console transport with stack trace', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      const printfCalls = mockPrintf.mock.calls;
      const serviceConsolePrintf = printfCalls[printfCalls.length - 1][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'error',
        message: 'Test error',
        service: serviceName,
        stack: 'Error: Test error\n    at test.js:1:1'
      };

      const result = serviceConsolePrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test error');
      expect(result).toContain('Error: Test error');
      expect(result).toContain(`[${serviceName}]`);
    });

    it('should execute printf function for service logger console transport without meta data', () => {
      const serviceName = 'TestService';
      createServiceLogger(serviceName);

      const printfCalls = mockPrintf.mock.calls;
      const serviceConsolePrintf = printfCalls[printfCalls.length - 1][0];
      const logInfo = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message',
        service: serviceName
      };

      const result = serviceConsolePrintf(logInfo);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test message');
      expect(result).not.toContain('{}');
    });
  });

  describe('Log Format Configuration', () => {
    it('should configure printf format for console transport', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Check that printf format is configured for console transport
      const consoleCall = (winston.transports.Console as any).mock.calls[0];
      expect(consoleCall[0].format).toBeDefined();
    });

    it('should handle log entries with stack traces', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Verify that errors format is configured to include stack traces
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
    });

    it('should configure JSON format for file transports', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('info');

      createLoggerConfig(mockConfigService);

      // Verify that JSON format is used
      expect(winston.format.json).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => createLoggerConfig(mockConfigService)).not.toThrow();
    });

    it('should handle invalid log levels gracefully', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('invalid-level');

      expect(() => createLoggerConfig(mockConfigService)).not.toThrow();
    });

    it('should handle empty service name gracefully', () => {
      expect(() => createServiceLogger('')).not.toThrow();
    });

    it('should handle null service name gracefully', () => {
      expect(() => createServiceLogger(null as any)).not.toThrow();
    });

    it('should handle undefined service name gracefully', () => {
      expect(() => createServiceLogger(undefined as any)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle test environment configuration', () => {
      mockConfigService.get
        .mockReturnValueOnce('test')
        .mockReturnValueOnce('debug');

      const config = createLoggerConfig(mockConfigService);

      expect(config).toBeDefined();
      expect(config.transports).toHaveLength(3); // console + 2 file transports (no debug in test)
    });

    it('should handle staging environment configuration', () => {
      mockConfigService.get
        .mockReturnValueOnce('staging')
        .mockReturnValueOnce('warn');

      const config = createLoggerConfig(mockConfigService);

      expect(config).toBeDefined();
      expect(config.level).toBe('warn');
      expect(config.transports).toHaveLength(3); // console + 2 file transports
    });

    it('should handle custom log level configuration', () => {
      mockConfigService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce('silly');

      const config = createLoggerConfig(mockConfigService);

      expect(config).toBeDefined();
      expect(config.level).toBe('silly');
    });
  });
}); 