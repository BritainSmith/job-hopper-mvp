import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>();

    // Get rate limit info from the throttler detail
    const { ttl, limit } = throttlerLimitDetail;

    // Calculate when the rate limit resets (ttl is in seconds)
    const resetTime = new Date(Date.now() + ttl * 1000);

    // Create a user-friendly error message
    const errorMessage = `Rate limit exceeded. You can make ${limit} requests per ${ttl} seconds. Rate limit resets at ${resetTime.toISOString()}.`;

    // Set rate limit headers
    response.header('X-RateLimit-Limit', limit.toString());
    response.header('X-RateLimit-Remaining', '0');
    response.header('X-RateLimit-Reset', resetTime.getTime().toString());
    response.header('Retry-After', ttl.toString());

    // Throw a custom throttler exception with the friendly message
    throw new ThrottlerException(errorMessage);
  }
}
