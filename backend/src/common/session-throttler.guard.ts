import { Injectable } from '@nestjs/common';
import { AuthThrottlerGuard } from './auth-throttler.guard';

/**
 * Rate limiter for authenticated in-app traffic (catalog browsing, attempt
 * auto-save, submission).
 *
 * Reuses the exponential-backoff behaviour of AuthThrottlerGuard but applies
 * only the loose `session` throttler, not the deliberately strict per-IP and
 * per-account auth limits. Auto-save fires on every answer selection and
 * navigation change during a 60-minute test, so an auth-grade cap would lock a
 * student out mid-exam — a far worse failure than the abuse it would prevent.
 *
 * Keyed on the authenticated user id where available, so one student on a
 * shared/NAT'd connection cannot exhaust the budget for everyone behind it.
 */
@Injectable()
export class SessionThrottlerGuard extends AuthThrottlerGuard {
  async onModuleInit() {
    await super.onModuleInit();
    this.throttlers = this.throttlers.filter(
      (throttler) => throttler.name === 'session',
    );
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req?.user?.sub;
    if (typeof userId === 'string' && userId.length > 0) {
      return `user:${userId}`;
    }
    return super.getTracker(req);
  }
}
