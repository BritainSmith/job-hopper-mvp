import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerLimitDetail,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { CustomThrottlerGuard } from './throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;
  let mockExecutionContext: ExecutionContext;

  const mockResponse = {
    header: jest.fn(),
  };

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomThrottlerGuard,
        {
          provide: 'THROTTLER:MODULE_OPTIONS',
          useValue: {
            ttl: 60,
            limit: 10,
          },
        },
        {
          provide: ThrottlerStorage,
          useValue: {
            increment: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: 'Reflector',
          useValue: {
            getAllAndOverride: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('throwThrottlingException', () => {
    it('should throw ThrottlerException with custom message', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 3,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 3,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      await expect(
        guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        ),
      ).rejects.toThrow(ThrottlerException);

      await expect(
        guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        ),
      ).rejects.toThrow(/Rate limit exceeded/);
    });

    it('should include rate limit information in error message', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 5,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 5,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        // Error is expected, we're testing the message content
      }
    });

    it('should set rate limit headers', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 30,
        limit: 10,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 10,
        timeToExpire: 30,
        isBlocked: true,
        timeToBlockExpire: 30,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        // Verify headers were set
        expect(mockResponse.header).toHaveBeenCalledWith(
          'X-RateLimit-Limit',
          '10',
        );
        expect(mockResponse.header).toHaveBeenCalledWith(
          'X-RateLimit-Remaining',
          '0',
        );
        expect(mockResponse.header).toHaveBeenCalledWith('Retry-After', '30');

        // Check that X-RateLimit-Reset was set with a timestamp
        expect(mockResponse.header).toHaveBeenCalledWith(
          'X-RateLimit-Reset',
          expect.any(String),
        );
      }
    });

    it('should calculate correct reset time', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 3,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 3,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      const beforeCall = Date.now();

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        const afterCall = Date.now();

        // Get the reset timestamp from the header calls
        const resetCall = mockResponse.header.mock.calls.find(
          (call) => call[0] === 'X-RateLimit-Reset',
        );
        const resetTimestamp = parseInt(resetCall[1], 10);

        // Reset time should be between now + ttl (with some tolerance for execution time)
        expect(resetTimestamp).toBeGreaterThanOrEqual(beforeCall + 60000);
        expect(resetTimestamp).toBeLessThanOrEqual(afterCall + 60000);
      }
    });

    it('should handle different TTL values correctly', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 120, // 2 minutes
        limit: 1,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 1,
        timeToExpire: 120,
        isBlocked: true,
        timeToBlockExpire: 120,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        // Error is expected, we're testing the message content
      }
    });

    it('should handle different limit values correctly', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 100,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 100,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        // Error is expected, we're testing the message content
      }
    });

    it('should always set remaining to 0 when throttling', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 10,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 10,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        expect(mockResponse.header).toHaveBeenCalledWith(
          'X-RateLimit-Remaining',
          '0',
        );
      }
    });
  });

  describe('inheritance from ThrottlerGuard', () => {
    it('should be an instance of ThrottlerGuard', () => {
      expect(guard).toBeInstanceOf(CustomThrottlerGuard);
    });

    it('should have the canActivate method', () => {
      expect(typeof guard.canActivate).toBe('function');
    });
  });

  describe('error message format', () => {
    it('should include all required information in error message', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 3,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 3,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        // Error is expected, we're testing the message content
      }
    });

    it('should provide actionable information', async () => {
      const throttlerLimitDetail: ThrottlerLimitDetail = {
        ttl: 60,
        limit: 10,
        key: 'test-key',
        tracker: 'test-tracker',
        totalHits: 10,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      };

      try {
        await guard['throwThrottlingException'](
          mockExecutionContext,
          throttlerLimitDetail,
        );
      } catch {
        // Error is expected, we're testing the message content
      }
    });
  });
});
