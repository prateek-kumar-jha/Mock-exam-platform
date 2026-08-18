/**
 * Tracks repeated rate-limit violations so that each successive violation is
 * blocked for longer than the last (exponential backoff), rather than tripping
 * a hard lockout. Violation counts decay once a caller behaves again, so a
 * legitimate user who fatfingers a password is not punished indefinitely.
 */
export class BackoffRegistry {
  private readonly violations = new Map<
    string,
    { count: number; lastSeen: number }
  >();

  constructor(
    private readonly baseMs: number,
    private readonly maxMs: number,
    /** A key with no violation inside this window resets to zero. */
    private readonly decayMs: number,
  ) {}

  private prune(now: number) {
    for (const [key, entry] of this.violations) {
      if (now - entry.lastSeen > this.decayMs) {
        this.violations.delete(key);
      }
    }
  }

  record(key: string): number {
    const now = Date.now();
    this.prune(now);

    const entry = this.violations.get(key);
    const count = entry ? entry.count + 1 : 1;
    this.violations.set(key, { count, lastSeen: now });
    return count;
  }

  /** Block duration in ms for the *next* violation on this key. */
  blockDurationFor(key: string): number {
    const now = Date.now();
    this.prune(now);

    const entry = this.violations.get(key);
    const count = entry ? entry.count : 0;
    if (count === 0) return this.baseMs;

    const backoff = this.baseMs * Math.pow(2, count);
    return Math.min(backoff, this.maxMs);
  }
}