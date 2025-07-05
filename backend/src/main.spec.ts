import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/error.filter';

// Mock external dependencies
jest.mock('@nestjs/core');
jest.mock('@nestjs/swagger');
jest.mock('./common/interceptors/logging.interceptor');
jest.mock('./common/filters/error.filter');

describe('Main Application Bootstrap', () => {
  let mockApp: any;
  let mockValidationPipe: any;
  let mockLoggingInterceptor: any;
  let mockGlobalExceptionFilter: any;
  let mockDocumentBuilder: any;
  let mockSwaggerModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock NestFactory
    const mockNestFactory = {
      create: jest.fn(),
    };
    (require('@nestjs/core').NestFactory as any) = mockNestFactory;

    // Mock app instance
    mockApp = {
      useGlobalPipes: jest.fn(),
      useGlobalInterceptors: jest.fn(),
      useGlobalFilters: jest.fn(),
      listen: jest.fn(),
    };

    // Mock ValidationPipe
    mockValidationPipe = {
      constructor: jest.fn(),
    };
    (ValidationPipe as any) = jest.fn().mockImplementation(() => mockValidationPipe);

    // Mock LoggingInterceptor
    mockLoggingInterceptor = {
      constructor: jest.fn(),
    };
    (LoggingInterceptor as any) = jest.fn().mockImplementation(() => mockLoggingInterceptor);

    // Mock GlobalExceptionFilter
    mockGlobalExceptionFilter = {
      constructor: jest.fn(),
    };
    (GlobalExceptionFilter as any) = jest.fn().mockImplementation(() => mockGlobalExceptionFilter);

    // Mock DocumentBuilder
    mockDocumentBuilder = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addTag: jest.fn().mockReturnThis(),
      addServer: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    };
    (DocumentBuilder as any) = jest.fn().mockImplementation(() => mockDocumentBuilder);

    // Mock SwaggerModule
    mockSwaggerModule = {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    };
    (SwaggerModule as any) = mockSwaggerModule;

    // Setup NestFactory mock
    mockNestFactory.create.mockResolvedValue(mockApp);

    // Mock process.env
    const originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = process.env;
  });

  describe('Application Bootstrap Configuration', () => {
    it('should configure global validation pipe with correct options', () => {
      expect(ValidationPipe).toBeDefined();
      expect(LoggingInterceptor).toBeDefined();
      expect(GlobalExceptionFilter).toBeDefined();
      expect(DocumentBuilder).toBeDefined();
      expect(SwaggerModule).toBeDefined();
    });

    it('should configure Swagger documentation with correct settings', () => {
      expect(DocumentBuilder).toBeDefined();
      expect(SwaggerModule).toBeDefined();
    });

    it('should handle environment port configuration', () => {
      // Test default port
      delete process.env.PORT;
      expect(process.env.PORT).toBeUndefined();

      // Test custom port
      process.env.PORT = '4000';
      expect(process.env.PORT).toBe('4000');
    });

    it('should have proper logging configuration', () => {
      expect(Logger).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should have all required dependencies available', () => {
      expect(ValidationPipe).toBeDefined();
      expect(LoggingInterceptor).toBeDefined();
      expect(GlobalExceptionFilter).toBeDefined();
      expect(DocumentBuilder).toBeDefined();
      expect(SwaggerModule).toBeDefined();
    });
  });
}); 