/** Shared identifiers for the attempt auto-submit queue. */
export const ATTEMPTS_QUEUE = 'attempts';

export const AUTO_SUBMIT_JOB = 'auto-submit';

export type AutoSubmitJobData = {
  attemptId: string;
};

/**
 * Deterministic job id, so enqueuing twice for the same attempt (e.g. a resumed
 * attempt hitting startAttempt again) reuses the existing delayed job instead
 * of stacking duplicates.
 */
export function autoSubmitJobId(attemptId: string): string {
  return `auto-submit-${attemptId}`;
}
