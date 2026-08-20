import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SaveAnswerDto } from './dto/save-answer.dto';
import {
  ATTEMPTS_QUEUE,
  AUTO_SUBMIT_JOB,
  autoSubmitJobId,
  type AutoSubmitJobData,
} from './attempts.queue';

/** Marks awarded per outcome, read from a test's marking_scheme JSON. */
type MarkingScheme = {
  correct: number;
  incorrect: number;
  unattempted: number;
};

/**
 * Test attempt lifecycle.
 *
 * Two rules govern everything here, per CLAUDE.md and 01-PRD.md §3.1:
 *
 *  1. Time is server-authoritative. `started_at` is the database's clock and
 *     the deadline is always *derived* from it — never stored redundantly and
 *     never accepted from a client. A client-supplied timestamp is not read
 *     anywhere in this file.
 *  2. Answer keys never leave the server during an active attempt. Every
 *     question query uses an explicit select list that omits `correct_option`
 *     and `explanation`.
 */
@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(ATTEMPTS_QUEUE) private attemptsQueue: Queue<AutoSubmitJobData>,
  ) {}

  /**
   * Schedules the offline auto-submit safety net for an attempt.
   *
   * The on-access path handles a student who reconnects; this covers the one
   * who never comes back (01-PRD.md §3.1: "auto-submit on time expiry, even if
   * the client is offline"). Whichever fires first wins — finalizeAttempt's
   * conditional write makes the loser a no-op.
   *
   * A queue outage must never block a student from starting a test, so a
   * failure here is logged rather than thrown.
   */
  private async scheduleAutoSubmit(attemptId: string, deadline: Date) {
    const delay = Math.max(0, deadline.getTime() - Date.now());

    try {
      await this.attemptsQueue.add(
        AUTO_SUBMIT_JOB,
        { attemptId },
        {
          delay,
          // Deterministic id: re-enqueuing for the same attempt is a no-op
          // rather than a duplicate job.
          jobId: autoSubmitJobId(attemptId),
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: true,
          // Keep failures around for inspection instead of silently dropping.
          removeOnFail: false,
        },
      );
    } catch (error) {
      // Loud, but non-fatal: a student must never be blocked from starting a
      // test by a queue outage. The on-access path still finalizes the attempt
      // whenever they next touch it; only the offline safety net is lost, so
      // this log line is the signal to investigate.
      this.logger.error(
        `Failed to schedule auto-submit for attempt ${attemptId} — ` +
          `offline auto-submit will NOT fire for this attempt`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Deadline is derived, never persisted, so it can't drift from started_at. */
  private deadlineFor(startedAt: Date, durationMinutes: number): Date {
    return new Date(startedAt.getTime() + durationMinutes * 60_000);
  }

  /**
   * Reads a test's marking_scheme JSON defensively. A malformed or missing
   * scheme must not silently score everything as zero, so each key falls back
   * to a conventional default rather than NaN.
   */
  private parseMarkingScheme(raw: unknown): MarkingScheme {
    const scheme = (raw ?? {}) as Record<string, unknown>;
    const num = (value: unknown, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback;

    return {
      correct: num(scheme.correct, 1),
      incorrect: num(scheme.incorrect, 0),
      unattempted: num(scheme.unattempted, 0),
    };
  }

  /**
   * Scores an attempt against the real answer key and writes the terminal
   * state in one transaction.
   *
   * This is the only place `correct_option` is ever read, and it never leaves
   * the server — only the resulting total does. Scoring iterates over the
   * test's full question list (not just saved answers) so skipped questions
   * are counted as unattempted rather than ignored.
   */
  async finalizeAttempt(
    attemptId: string,
    status: 'submitted' | 'auto_submitted',
    submittedAt: Date,
  ) {
    const attempt = await this.prisma.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: {
        id: true,
        test: {
          select: {
            marking_scheme: true,
            testQuestions: {
              select: {
                question: { select: { id: true, correct_option: true } },
              },
            },
          },
        },
        answers: { select: { question_id: true, selected_option: true } },
      },
    });

    const scheme = this.parseMarkingScheme(attempt.test.marking_scheme);
    const answerByQuestion = new Map(
      attempt.answers.map((answer) => [answer.question_id, answer.selected_option]),
    );

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    for (const link of attempt.test.testQuestions) {
      const selected = answerByQuestion.get(link.question.id);

      if (selected === null || selected === undefined || selected === '') {
        unattempted += 1;
      } else if (selected === link.question.correct_option) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    }

    const total =
      correct * scheme.correct +
      incorrect * scheme.incorrect +
      unattempted * scheme.unattempted;

    // Conditional write: only an attempt still in_progress is finalized. This
    // is what makes the operation idempotent and safe to race — if the
    // on-access path (or a manual submit) already finished this attempt, the
    // updateMany matches zero rows and the existing score is left untouched.
    const written = await this.prisma.attempt.updateMany({
      where: { id: attemptId, status: 'in_progress' },
      data: { status, submitted_at: submittedAt, total_score: total },
    });

    const updated = await this.prisma.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: { id: true, status: true, submitted_at: true, total_score: true },
    });

    return {
      attempt_id: updated.id,
      status: updated.status,
      submitted_at: updated.submitted_at,
      total_score: updated.total_score ? updated.total_score.toNumber() : 0,
      /** False when another path had already finalized this attempt. */
      applied: written.count > 0,
      breakdown: {
        correct,
        incorrect,
        unattempted,
        total_questions: attempt.test.testQuestions.length,
      },
      marking_scheme: scheme,
    };
  }

  /**
   * Loads an attempt, enforces ownership, and auto-submits it if its deadline
   * has passed. Every route that touches an attempt goes through here, so an
   * expired attempt can never be read or written as if it were still open.
   *
   * Returns the attempt plus whether this call auto-submitted it.
   */
  private async loadOpenAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        user_id: true,
        status: true,
        started_at: true,
        test: { select: { id: true, duration_minutes: true } },
      },
    });

    // Identical response for "missing" and "not yours" — the status code must
    // not reveal which attempt ids exist.
    if (!attempt || attempt.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this attempt');
    }

    const deadline = this.deadlineFor(
      attempt.started_at,
      attempt.test.duration_minutes,
    );
    const now = new Date();
    const expired = now > deadline;

    let autoSubmitted = false;
    if (expired && attempt.status === 'in_progress') {
      // Auto-submit on expiry (01-PRD.md §3.1). Scored at the deadline, not at
      // the moment of discovery, so a late request can't extend the window.
      await this.finalizeAttempt(attempt.id, 'auto_submitted', deadline);
      autoSubmitted = true;
    }

    return { attempt, deadline, expired, autoSubmitted };
  }

  async startAttempt(testId: string, userId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        status: true,
        duration_minutes: true,
        scheduled_start: true,
        scheduled_end: true,
      },
    });

    // Unpublished tests are indistinguishable from missing ones to a student,
    // so a draft can't be probed for existence.
    if (!test || test.status !== 'published') {
      throw new NotFoundException('Test not found');
    }

    // Live test window check, against the server clock only.
    const now = new Date();
    if (test.scheduled_start && now < test.scheduled_start) {
      throw new ForbiddenException('This test has not started yet');
    }
    if (test.scheduled_end && now > test.scheduled_end) {
      throw new ForbiddenException('This test has already closed');
    }

    // Resume rather than duplicate: a student who reconnects mid-test must get
    // their original attempt back, including its original started_at, so the
    // clock cannot be reset by starting over.
    const existing = await this.prisma.attempt.findFirst({
      where: { test_id: test.id, user_id: userId, status: 'in_progress' },
      select: { id: true, started_at: true },
    });

    if (existing) {
      const deadline = this.deadlineFor(
        existing.started_at,
        test.duration_minutes,
      );
      // Re-scheduling is safe: the deterministic job id means this reuses the
      // job already queued at first start rather than adding another. It also
      // restores the job if Redis lost it while the attempt was open.
      await this.scheduleAutoSubmit(existing.id, deadline);

      return {
        attempt_id: existing.id,
        test_id: test.id,
        started_at: existing.started_at,
        duration_minutes: test.duration_minutes,
        deadline,
        resumed: true,
      };
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        test_id: test.id,
        user_id: userId,
        // started_at defaults to now() in the schema; set explicitly for clarity.
        started_at: now,
        status: 'in_progress',
      },
      select: { id: true, started_at: true },
    });

    const deadline = this.deadlineFor(
      attempt.started_at,
      test.duration_minutes,
    );
    await this.scheduleAutoSubmit(attempt.id, deadline);

    return {
      attempt_id: attempt.id,
      test_id: test.id,
      started_at: attempt.started_at,
      duration_minutes: test.duration_minutes,
      deadline,
      resumed: false,
    };
  }

  /** Auto-save. Called on every answer selection and navigation change. */
  async saveAnswer(
    attemptId: string,
    questionId: string,
    userId: string,
    dto: SaveAnswerDto,
  ) {
    const { attempt, deadline, expired } = await this.loadOpenAttempt(
      attemptId,
      userId,
    );

    if (expired) {
      throw new ConflictException(
        'Time is up. This attempt has been submitted automatically.',
      );
    }
    if (attempt.status !== 'in_progress') {
      throw new ConflictException('This attempt has already been submitted');
    }

    // The question must belong to this attempt's test — otherwise a student
    // could seed answers for questions from a different test entirely.
    const link = await this.prisma.testQuestion.findFirst({
      where: { test_id: attempt.test.id, question_id: questionId },
      select: { question_id: true },
    });
    if (!link) {
      throw new NotFoundException('Question not found in this test');
    }

    const saved = await this.prisma.attemptAnswer.upsert({
      where: {
        attempt_id_question_id: {
          attempt_id: attempt.id,
          question_id: questionId,
        },
      },
      update: {
        selected_option: dto.selected_option ?? null,
        status: dto.status,
        time_spent_seconds: dto.time_spent_seconds ?? 0,
      },
      create: {
        attempt_id: attempt.id,
        question_id: questionId,
        selected_option: dto.selected_option ?? null,
        status: dto.status,
        time_spent_seconds: dto.time_spent_seconds ?? 0,
      },
      // No correctness field is returned: a student must not learn whether an
      // answer was right while the attempt is still open.
      select: {
        question_id: true,
        selected_option: true,
        status: true,
        time_spent_seconds: true,
        updated_at: true,
      },
    });

    return { saved, deadline, server_time: new Date() };
  }

  /** Manual submission. Idempotent-safe: a second call never re-scores. */
  async submitAttempt(attemptId: string, userId: string) {
    const { attempt, autoSubmitted } = await this.loadOpenAttempt(
      attemptId,
      userId,
    );

    if (autoSubmitted) {
      throw new ConflictException(
        'Time was up. This attempt was submitted automatically.',
      );
    }
    if (attempt.status !== 'in_progress') {
      throw new ConflictException('This attempt has already been submitted');
    }

    return this.finalizeAttempt(attempt.id, 'submitted', new Date());
  }

  async getAttempt(attemptId: string, userId: string) {
    // Enforces ownership and auto-submits on expiry before reading state.
    await this.loadOpenAttempt(attemptId, userId);

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        user_id: true,
        status: true,
        started_at: true,
        submitted_at: true,
        total_score: true,
        test: {
          select: {
            id: true,
            title: true,
            duration_minutes: true,
            marking_scheme: true,
            testQuestions: {
              orderBy: { sequence_order: 'asc' },
              select: {
                sequence_order: true,
                section: true,
                question: {
                  select: {
                    id: true,
                    subject: true,
                    topic: true,
                    difficulty: true,
                    question_text: true,
                    options: true,
                    // correct_option and explanation are deliberately absent:
                    // they must never reach the browser mid-attempt.
                  },
                },
              },
            },
          },
        },
        answers: {
          select: {
            question_id: true,
            selected_option: true,
            status: true,
            time_spent_seconds: true,
            updated_at: true,
          },
        },
      },
    });

    // Same response for "missing" and "someone else's", so an attacker can't
    // use the status code to discover which attempt ids exist.
    if (!attempt || attempt.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this attempt');
    }

    return {
      attempt_id: attempt.id,
      status: attempt.status,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      // Only populated once the attempt is finished; null while in progress.
      total_score: attempt.total_score ? attempt.total_score.toNumber() : null,
      // Recomputed on every read so a reconnecting client resyncs to the
      // server's view of the clock rather than its own.
      deadline: this.deadlineFor(
        attempt.started_at,
        attempt.test.duration_minutes,
      ),
      server_time: new Date(),
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        duration_minutes: attempt.test.duration_minutes,
        marking_scheme: attempt.test.marking_scheme,
      },
      questions: attempt.test.testQuestions.map((link) => ({
        sequence_order: link.sequence_order,
        section: link.section,
        id: link.question.id,
        subject: link.question.subject,
        topic: link.question.topic,
        difficulty: link.question.difficulty,
        question_text: link.question.question_text,
        options: link.question.options,
      })),
      answers: attempt.answers,
    };
  }
}
