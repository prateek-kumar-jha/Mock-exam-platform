import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Read-only catalog queries backing the student dashboard.
 *
 * Everything here is public-facing browse data, so each query selects an
 * explicit field list — never the whole row — to avoid leaking columns that
 * shouldn't reach a browser (e.g. a question's correct_option).
 */
@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  /** Packages a student can actually buy; drafts and archives stay hidden. */
  async listPackages() {
    const packages = await this.prisma.package.findMany({
      where: { status: 'active' },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        packageExams: {
          select: {
            exam: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      // Decimal doesn't survive JSON cleanly; send a plain number.
      price: pkg.price.toNumber(),
      exams: pkg.packageExams.map((link) => link.exam),
    }));
  }

  /** Published tests only — drafts belong to their author, not the catalog. */
  async listTests() {
    const tests = await this.prisma.test.findMany({
      where: { status: 'published' },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        duration_minutes: true,
        scheduled_start: true,
        scheduled_end: true,
        testSeries: {
          select: {
            id: true,
            title: true,
            type: true,
            exam: { select: { id: true, name: true, category: true } },
          },
        },
        // Counting rather than returning questions keeps answers server-side.
        _count: { select: { testQuestions: true } },
      },
    });

    return tests.map((test) => ({
      id: test.id,
      title: test.title,
      duration_minutes: test.duration_minutes,
      scheduled_start: test.scheduled_start,
      scheduled_end: test.scheduled_end,
      question_count: test._count.testQuestions,
      series: test.testSeries
        ? {
            id: test.testSeries.id,
            title: test.testSeries.title,
            type: test.testSeries.type,
          }
        : null,
      exam: test.testSeries?.exam ?? null,
    }));
  }
}
