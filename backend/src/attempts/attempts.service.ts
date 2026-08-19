import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  /** Deadline is derived, never persisted, so it can't drift from started_at. */
  private deadlineFor(startedAt: Date, durationMinutes: number): Date {
    return new Date(startedAt.getTime() + durationMinutes * 60_000);
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
      return {
        attempt_id: existing.id,
        test_id: test.id,
        started_at: existing.started_at,
        duration_minutes: test.duration_minutes,
        deadline: this.deadlineFor(existing.started_at, test.duration_minutes),
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

    return {
      attempt_id: attempt.id,
      test_id: test.id,
      started_at: attempt.started_at,
      duration_minutes: test.duration_minutes,
      deadline: this.deadlineFor(attempt.started_at, test.duration_minutes),
      resumed: false,
    };
  }

  async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        user_id: true,
        status: true,
        started_at: true,
        submitted_at: true,
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
