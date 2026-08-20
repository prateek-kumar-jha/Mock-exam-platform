import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptsService } from './attempts.service';
import { ATTEMPTS_QUEUE, type AutoSubmitJobData } from './attempts.queue';

/**
 * Offline auto-submit worker.
 *
 * Fires at an attempt's deadline even if the student never reconnects, which
 * the on-access path cannot cover (01-PRD.md §3.1). Scoring is not
 * reimplemented here — it delegates to AttemptsService.finalizeAttempt so
 * there is exactly one scoring implementation in the codebase.
 */
@Processor(ATTEMPTS_QUEUE)
export class AttemptsProcessor extends WorkerHost {
  private readonly logger = new Logger(AttemptsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private attemptsService: AttemptsService,
  ) {
    super();
  }

  async process(job: Job<AutoSubmitJobData>) {
    const { attemptId } = job.data;

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        started_at: true,
        test: { select: { duration_minutes: true } },
      },
    });

    // The attempt may have been deleted since the job was queued.
    if (!attempt) {
      this.logger.warn(`Auto-submit skipped: attempt ${attemptId} not found`);
      return { skipped: 'not_found' };
    }

    // Already finished by the on-access path or a manual submit.
    if (attempt.status !== 'in_progress') {
      this.logger.log(
        `Auto-submit no-op: attempt ${attemptId} already ${attempt.status}`,
      );
      return { skipped: attempt.status };
    }

    // Recomputed from the database, never taken from the job payload — a
    // stale or tampered job must not be able to shift the deadline.
    const deadline = new Date(
      attempt.started_at.getTime() + attempt.test.duration_minutes * 60_000,
    );

    // Guard against an early fire (e.g. clock skew): requeue rather than
    // finalizing a test that is legitimately still running.
    if (Date.now() < deadline.getTime()) {
      this.logger.warn(
        `Auto-submit fired early for ${attemptId}; deferring to ${deadline.toISOString()}`,
      );
      throw new Error('Deadline not yet reached');
    }

    const result = await this.attemptsService.finalizeAttempt(
      attempt.id,
      'auto_submitted',
      deadline,
    );

    this.logger.log(
      `Auto-submitted attempt ${attemptId}: score=${result.total_score} applied=${result.applied}`,
    );
    return result;
  }
}
