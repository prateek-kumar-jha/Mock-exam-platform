import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { BackoffRegistry } from './backoff.registry';

/**
 * Rate limiter for the auth routes.
 *
 * Two independent trackers run per request (configured as named throttlers in
 * AppModule): one keyed on the client IP, one keyed on the submitted account
 * identifier. The IP tracker stops a single host spraying many accounts; the
 * account tracker stops a distributed attempt against one account.
 *
 * Rather than locking an account out, each repeated violation is blocked for
 * exponentially longer, decaying back to zero once the caller stops abusing
 * the endpoint.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private backoff?: BackoffRegistry;

  private registry(): BackoffRegistry {
    if (!this.backoff) {
      this.backoff = new BackoffRegistry(
        Number(process.env.RATE_LIMIT_BLOCK_BASE_MS ?? 60_000),
        Number(process.env.RATE_LIMIT_BLOCK_MAX_MS ?? 3_600_000),
        Number(process.env.RATE_LIMIT_BLOCK_DECAY_MS ?? 3_600_000),
      );
    }
    return this.backoff;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, generateKey, getTracker } =
      requestProps;
    const { req, res } = this.getRequestResponse(context);

    const tracker = getTracker
      ? await getTracker(req, context)
      : await this.getTracker(req);
    const key = generateKey(context, tracker, throttler.name ?? 'default');

    // Grow the block window with each repeated violation instead of applying a
    // flat penalty or a permanent lockout.
    const blockDuration = this.registry().blockDurationFor(key);

    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name ?? 'default',
      );

    if (isBlocked) {
      this.registry().record(key);
      res.header?.('Retry-After', String(timeToBlockExpire));
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }

  /** Falls back to the socket address when no proxy header is present. */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return (
      req.ips?.length ? req.ips[0] : req.ip ?? req.socket?.remoteAddress ?? 'unknown'
    );
  }

  protected getRequestResponse(context: ExecutionContext) {
    return super.getRequestResponse(context);
  }
}