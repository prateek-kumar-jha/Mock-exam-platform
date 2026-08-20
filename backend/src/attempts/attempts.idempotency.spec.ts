import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AttemptsService } from './attempts.service';
import { AttemptsProcessor } from './attempts.processor';
import type { Job } from 'bullmq';
import type { AutoSubmitJobData } from './attempts.queue';

/**
 * Proves the auto-submit job is a safe no-op when the on-access path (or a
 * manual submit) already finalized the attempt.
 *
 * Runs against the real development database rather than mocks, because the
 * property under test is a conditional SQL write — a mocked Prisma client
 * would prove nothing about whether the guard actually holds.
 */
describe('auto-submit idempotency', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  }) as any;

  // The queue is never exercised here; only the worker's process() logic is.
  const queueStub = { add: jest.fn() } as any;
  const service = new AttemptsService(prisma, queueStub);
  const processor = new AttemptsProcessor(prisma, service);

  let userId: string;
  let testId: string;
  let attemptId: string;
  let correctOption: string;
  let questionId: string;

  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'test@example.com' },
      select: { id: true },
    });
    userId = user.id;

    const test = await prisma.test.findFirstOrThrow({
      where: { status: 'published' },
      select: {
        id: true,
        testQuestions: {
          orderBy: { sequence_order: 'asc' },
          select: { question: { select: { id: true, correct_option: true } } },
        },
      },
    });
    testId = test.id;
    questionId = test.testQuestions[0].question.id;
    correctOption = test.testQuestions[0].question.correct_option;
  });

  afterAll(async () => {
    if (attemptId) {
      await prisma.attempt.deleteMany({ where: { id: attemptId } });
    }
    await prisma.$disconnect();
  });

  it('leaves an already-submitted attempt untouched when the job fires', async () => {
    // Arrange: an attempt whose deadline has passed, with one correct answer.
    const started = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const attempt = await prisma.attempt.create({
      data: {
        test_id: testId,
        user_id: userId,
        started_at: started,
        status: 'in_progress',
      },
      select: { id: true },
    });
    attemptId = attempt.id;

    await prisma.attemptAnswer.create({
      data: {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: correctOption,
        status: 'answered',
      },
    });

    // Act 1: the student submits manually first.
    const manual = await service.finalizeAttempt(
      attemptId,
      'submitted',
      new Date(),
    );
    expect(manual.applied).toBe(true);
    expect(manual.status).toBe('submitted');

    const afterManual = await prisma.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: { status: true, submitted_at: true, total_score: true },
    });

    // Act 2: the delayed job fires afterwards for the same attempt.
    const job = { data: { attemptId } } as Job<AutoSubmitJobData>;
    const jobResult = await processor.process(job);

    // Assert: the job recognised the terminal state and skipped.
    expect(jobResult).toEqual({ skipped: 'submitted' });

    // Assert: nothing in the row changed — not the status, not the score,
    // and critically not submitted_at.
    const afterJob = await prisma.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: { status: true, submitted_at: true, total_score: true },
    });

    expect(afterJob.status).toBe('submitted');
    expect(afterJob.status).toBe(afterManual.status);
    expect(afterJob.submitted_at?.getTime()).toBe(
      afterManual.submitted_at?.getTime(),
    );
    expect(afterJob.total_score?.toString()).toBe(
      afterManual.total_score?.toString(),
    );
  });

  it('finalizeAttempt itself refuses to overwrite a terminal attempt', async () => {
    // Even called directly, bypassing the processor's status check, the
    // conditional write must not clobber an existing result.
    const before = await prisma.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: { status: true, submitted_at: true, total_score: true },
    });

    const second = await service.finalizeAttempt(
      attemptId,
      'auto_submitted',
      new Date(),
    );

    expect(second.applied).toBe(false);
    expect(second.status).toBe('submitted');

    const after = await prisma.attempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: { status: true, submitted_at: true, total_score: true },
    });

    expect(after.status).toBe(before.status);
    expect(after.submitted_at?.getTime()).toBe(before.submitted_at?.getTime());
    expect(after.total_score?.toString()).toBe(before.total_score?.toString());
  });
});
