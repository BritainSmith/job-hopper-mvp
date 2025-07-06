import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

/* eslint-disable @typescript-eslint/no-unsafe-return */
describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0 (Test Browser)',
      },
    };

    mockResponse = {
      statusCode: 200,
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should log incoming request and successful response', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'log')
        .mockImplementation(() => {});
      const responseData = { message: 'Success' };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);

          // Check that request was logged
          expect(loggerSpy).toHaveBeenNthCalledWith(1, {
            message: 'Incoming request',
            method: 'GET',
            url: '/api/test',
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Test Browser)',
            timestamp: expect.any(String),
          });

          // Check that successful response was logged
          expect(loggerSpy).toHaveBeenNthCalledWith(2, {
            message: 'Request completed',
            method: 'GET',
            url: '/api/test',
            statusCode: 200,
            duration: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          });

          done();
        },
        error: done,
      });
    });

    it('should log incoming request and error response', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'error')
        .mockImplementation(() => {});
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => done(new Error('Should have thrown error')),
        error: (thrownError) => {
          expect(thrownError).toBe(error);

          // Check that error was logged
          expect(loggerSpy).toHaveBeenCalledWith({
            message: 'Request failed',
            method: 'GET',
            url: '/api/test',
            error: 'Test error',
            stack: 'Error stack trace',
            duration: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          });

          done();
        },
      });
    });

    it('should handle request without user-agent header', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'log')
        .mockImplementation(() => {});
      mockRequest.headers = {};

      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenNthCalledWith(1, {
            message: 'Incoming request',
            method: 'GET',
            url: '/api/test',
            ip: '127.0.0.1',
            userAgent: '',
            timestamp: expect.any(String),
          });

          done();
        },
        error: done,
      });
    });

    it('should calculate duration for successful request', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'log')
        .mockImplementation(() => {});

      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenNthCalledWith(2, {
            message: 'Request completed',
            method: 'GET',
            url: '/api/test',
            statusCode: 200,
            duration: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          });

          done();
        },
        error: done,
      });
    });

    it('should calculate duration for failed request', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'error')
        .mockImplementation(() => {});

      const error = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => done(new Error('Should have thrown error')),
        error: () => {
          expect(loggerSpy).toHaveBeenCalledWith({
            message: 'Request failed',
            method: 'GET',
            url: '/api/test',
            error: 'Test error',
            stack: expect.any(String),
            duration: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          });

          done();
        },
      });
    });

    it('should handle different HTTP methods', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'log')
        .mockImplementation(() => {});
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenNthCalledWith(1, {
            message: 'Incoming request',
            method: 'POST',
            url: '/api/users',
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Test Browser)',
            timestamp: expect.any(String),
          });

          done();
        },
        error: done,
      });
    });

    it('should handle different response status codes', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'log')
        .mockImplementation(() => {});
      mockResponse.statusCode = 201;

      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenNthCalledWith(2, {
            message: 'Request completed',
            method: 'GET',
            url: '/api/test',
            statusCode: 201,
            duration: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          });

          done();
        },
        error: done,
      });
    });

    it('should generate valid ISO timestamps', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'log')
        .mockImplementation(() => {});

      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          const requestLog = loggerSpy.mock.calls[0][0];

          const responseLog = loggerSpy.mock.calls[1][0];

          // Verify timestamps are valid ISO strings
          expect(new Date(requestLog.timestamp).toISOString()).toBe(
            requestLog.timestamp,
          );
          expect(new Date(responseLog.timestamp).toISOString()).toBe(
            responseLog.timestamp,
          );

          done();
        },
        error: done,
      });
    });

    it('should handle error without stack trace', (done) => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'error')
        .mockImplementation(() => {});
      const error = new Error('Test error');
      delete error.stack;

      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => done(new Error('Should have thrown error')),
        error: () => {
          expect(loggerSpy).toHaveBeenCalledWith({
            message: 'Request failed',
            method: 'GET',
            url: '/api/test',
            error: 'Test error',
            stack: undefined,
            duration: expect.stringMatching(/^\d+ms$/),
            timestamp: expect.any(String),
          });

          done();
        },
      });
    });
  });
});
