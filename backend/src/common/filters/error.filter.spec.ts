import { GlobalExceptionFilter } from './error.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Response, Request } from 'express';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

interface MockRequest {
  method: string;
  url: string;
  ip: string;
  headers: Record<string, string>;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: MockResponse;
  let mockRequest: MockRequest;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Bad Request',
      });
    });

    it('should handle HttpException with object response', () => {
      const exceptionResponse = {
        message: 'Validation failed',
        errors: ['field is required'],
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Validation failed',
      });
    });

    it('should handle HttpException with object response but no message property', () => {
      const exceptionResponse = {
        error: 'Validation failed',
        errors: ['field is required'],
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Http Exception',
      });
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      error.name = 'CustomError';
      error.stack = 'Error stack trace';

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Something went wrong',
      });
    });

    it('should handle unknown exception types', () => {
      const unknownError = 'Unknown error string';

      filter.catch(unknownError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Internal server error',
      });
    });

    it('should include error details in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.name = 'TestError';
      error.stack = 'Test stack trace';

      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Test error',
        details: {
          name: 'TestError',
          stack: 'Test stack trace',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include error details in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');

      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Test error',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle request without user-agent header', () => {
      mockRequest.headers = {};
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Test',
      });
    });

    it('should generate valid ISO timestamp', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      const timestamp = new Date(responseCall.timestamp);

      expect(timestamp.toISOString()).toBe(responseCall.timestamp);
    });

    it('should log error with correct context', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith({
        message: 'Unhandled exception',
        error: 'Test error',
        statusCode: HttpStatus.BAD_REQUEST,
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String),
        details: expect.any(Object),
      });
    });
  });
});
