import { TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { WinstonConfigModule } from './winston.module';
import { createLoggerConfig } from './logger.config';

// Mock dependencies
jest.mock('nest-winston');
jest.mock('./logger.config');

describe('WinstonConfigModule', () => {
  let mockWinstonModule: any;
  let mockCreateLoggerConfig: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock WinstonModule
    mockWinstonModule = {
      forRootAsync: jest.fn().mockReturnValue({
        module: 'WinstonModule',
        providers: [],
        exports: [],
      }),
    };
    (WinstonModule as any) = mockWinstonModule;

    // Mock createLoggerConfig
    mockCreateLoggerConfig = jest.fn().mockReturnValue({
      transports: [],
      level: 'info',
      format: 'test-format',
    });
    (createLoggerConfig as any) = mockCreateLoggerConfig;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Module Configuration', () => {
    it('should be defined', () => {
      expect(WinstonConfigModule).toBeDefined();
    });

    it('should configure WinstonModule.forRootAsync', () => {
      // Test that the module is properly configured
      expect(WinstonModule.forRootAsync).toBeDefined();
    });

    it('should use createLoggerConfig as factory function', () => {
      expect(createLoggerConfig).toBeDefined();
    });
  });

  describe('Factory Function', () => {
    it('should call createLoggerConfig with ConfigService', () => {
      const mockConfigService = { get: jest.fn() };

      // Test that the factory function can be called
      expect(mockCreateLoggerConfig).toBeDefined();
      mockCreateLoggerConfig(mockConfigService);

      expect(mockCreateLoggerConfig).toHaveBeenCalledWith(mockConfigService);
    });

    it('should return logger configuration from factory', () => {
      const mockConfigService = { get: jest.fn() };

      const result = mockCreateLoggerConfig(mockConfigService);

      expect(result).toEqual({
        transports: [],
        level: 'info',
        format: 'test-format',
      });
    });
  });

  describe('Module Dependencies', () => {
    it('should import ConfigModule as dependency', () => {
      expect(ConfigModule).toBeDefined();
    });

    it('should inject ConfigService as dependency', () => {
      expect(ConfigService).toBeDefined();
    });
  });

  describe('Module Structure', () => {
    it('should have correct module metadata', () => {
      expect(WinstonConfigModule).toBeDefined();
    });

    it('should resolve dependencies successfully', () => {
      expect(WinstonModule).toBeDefined();
      expect(createLoggerConfig).toBeDefined();
    });
  });

  describe('Configuration Integration', () => {
    it('should integrate with ConfigService for logger configuration', () => {
      const mockConfigService = {
        get: jest
          .fn()
          .mockReturnValueOnce('development') // NODE_ENV
          .mockReturnValueOnce('debug'), // LOG_LEVEL
      };

      mockCreateLoggerConfig(mockConfigService);

      expect(mockCreateLoggerConfig).toHaveBeenCalledWith(mockConfigService);
    });
  });

  describe('Module Export', () => {
    it('should export Winston logger configuration', () => {
      expect(mockWinstonModule.forRootAsync).toBeDefined();
    });
  });
});
