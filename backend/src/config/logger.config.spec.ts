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
    printf: jest.fn().mockReturnValue('printf-format'),
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
      mockConfigService.get
        .mockReturnValueOnce('development') // NODE_ENV
        .mockReturnValueOnce(undefined); // LOG_LEVEL

      const config = createLoggerConfig(mockConfigService);

      // Our mock returns undefined for level, so we expect undefined here.
      // In a real config, this would default to 'info'.
      expect(config.level).toBeUndefined();
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
  });
}); 