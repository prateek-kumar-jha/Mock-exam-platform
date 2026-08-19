import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Local development seed data.
 *
 * Safe to re-run: every write is an upsert or a check-before-create keyed on a
 * stable natural key, so running this twice produces the same rows rather than
 * duplicates. No passwords or secrets are created here — the creator user is
 * looked up by email and must already exist (see auth signup).
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const CREATOR_EMAIL = 'test@example.com';

type SeedQuestion = {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: string[];
  correct_option: string;
  explanation: string;
};

const QUESTIONS: SeedQuestion[] = [
  {
    subject: 'Quantitative Aptitude',
    topic: 'Percentage',
    difficulty: 'easy',
    question_text:
      'If 25% of a number is 80, what is the number?',
    options: ['160', '240', '320', '400'],
    correct_option: '320',
    explanation: '25% of x = 80, so x = 80 × 4 = 320.',
  },
  {
    subject: 'Quantitative Aptitude',
    topic: 'Time and Work',
    difficulty: 'medium',
    question_text:
      'A can finish a piece of work in 12 days and B in 18 days. Working together, how many days will they take?',
    options: ['6.4 days', '7.2 days', '8.0 days', '9.6 days'],
    correct_option: '7.2 days',
    explanation:
      'Combined rate = 1/12 + 1/18 = 5/36 per day, so time = 36/5 = 7.2 days.',
  },
  {
    subject: 'Quantitative Aptitude',
    topic: 'Simple Interest',
    difficulty: 'easy',
    question_text:
      'What is the simple interest on Rs. 5,000 at 8% per annum for 3 years?',
    options: ['Rs. 1,000', 'Rs. 1,200', 'Rs. 1,400', 'Rs. 1,600'],
    correct_option: 'Rs. 1,200',
    explanation: 'SI = (5000 × 8 × 3) / 100 = Rs. 1,200.',
  },
  {
    subject: 'Quantitative Aptitude',
    topic: 'Averages',
    difficulty: 'hard',
    question_text:
      'The average of 11 numbers is 50. If the average of the first six is 49 and of the last six is 52, what is the sixth number?',
    options: ['56', '58', '60', '62'],
    correct_option: '56',
    explanation:
      'Sum of first six + last six = 294 + 312 = 606. Total of 11 numbers = 550. The sixth number is counted twice: 606 − 550 = 56.',
  },
  {
    subject: 'General Awareness',
    topic: 'Indian Polity',
    difficulty: 'easy',
    question_text:
      'Which Article of the Indian Constitution deals with the Right to Equality?',
    options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
    correct_option: 'Article 14',
    explanation:
      'Article 14 guarantees equality before the law and equal protection of the laws.',
  },
  {
    subject: 'General Awareness',
    topic: 'Geography',
    difficulty: 'medium',
    question_text: 'Which river is known as the "Sorrow of Bihar"?',
    options: ['Ganga', 'Kosi', 'Son', 'Gandak'],
    correct_option: 'Kosi',
    explanation:
      'The Kosi river frequently changes course and causes severe flooding in Bihar.',
  },
  {
    subject: 'General Awareness',
    topic: 'Indian History',
    difficulty: 'hard',
    question_text: 'The Battle of Plassey was fought in which year?',
    options: ['1757', '1764', '1857', '1761'],
    correct_option: '1757',
    explanation:
      'Fought on 23 June 1757 between the British East India Company and the Nawab of Bengal.',
  },
  {
    subject: 'English',
    topic: 'Synonyms',
    difficulty: 'easy',
    question_text: 'Choose the word most nearly similar in meaning to ABUNDANT.',
    options: ['Scarce', 'Plentiful', 'Modest', 'Brief'],
    correct_option: 'Plentiful',
    explanation: 'Abundant means existing in large quantities — plentiful.',
  },
  {
    subject: 'English',
    topic: 'Grammar',
    difficulty: 'medium',
    question_text:
      'Identify the correct sentence.',
    options: [
      'Neither of the boys were present.',
      'Neither of the boys was present.',
      'Neither of the boy were present.',
      'Neither of the boy was present.',
    ],
    correct_option: 'Neither of the boys was present.',
    explanation:
      '"Neither" is singular and takes a singular verb, while "of the boys" stays plural.',
  },
  {
    subject: 'English',
    topic: 'Idioms',
    difficulty: 'hard',
    question_text:
      'What does the idiom "to beat about the bush" mean?',
    options: [
      'To work very hard',
      'To avoid the main topic',
      'To search thoroughly',
      'To argue loudly',
    ],
    correct_option: 'To avoid the main topic',
    explanation:
      'It means to approach something indirectly instead of addressing it directly.',
  },
];

async function main() {
  // ---------------------------------------------------------------------
  // Creator — must already exist; the seed never creates credentials.
  // ---------------------------------------------------------------------
  const creator = await prisma.user.findUnique({
    where: { email: CREATOR_EMAIL },
  });

  if (!creator) {
    throw new Error(
      `Seed requires the user ${CREATOR_EMAIL} to exist. Sign that account up first, then re-run.`,
    );
  }
  console.log(`Creator: ${creator.email} (${creator.id})`);

  // ---------------------------------------------------------------------
  // Exams — no natural unique key in the schema, so check-before-create.
  // ---------------------------------------------------------------------
  const examSeeds = [
    { name: 'SSC CGL', category: 'Govt', description: 'Staff Selection Commission — Combined Graduate Level' },
    { name: 'SSC CHSL', category: 'Govt', description: 'Staff Selection Commission — Combined Higher Secondary Level' },
  ];

  const exams: Awaited<ReturnType<typeof prisma.exam.create>>[] = [];
  for (const seed of examSeeds) {
    const existing = await prisma.exam.findFirst({
      where: { name: seed.name, category: seed.category },
    });
    const exam = existing ?? (await prisma.exam.create({ data: seed }));
    console.log(`Exam: ${exam.name} (${existing ? 'existing' : 'created'})`);
    exams.push(exam);
  }

  // ---------------------------------------------------------------------
  // Package bundling both exams.
  // ---------------------------------------------------------------------
  const existingPackage = await prisma.package.findFirst({
    where: { title: 'SSC Package' },
  });

  const pkg =
    existingPackage ??
    (await prisma.package.create({
      data: {
        title: 'SSC Package',
        description: 'Bundle covering SSC CGL and SSC CHSL mock tests.',
        price: 999.0,
        status: 'active',
        created_by: creator.id,
      },
    }));
  console.log(`Package: ${pkg.title} (${existingPackage ? 'existing' : 'created'})`);

  // PackageExam has @@unique([package_id, exam_id]), so upsert is exact here.
  for (const exam of exams) {
    await prisma.packageExam.upsert({
      where: {
        package_id_exam_id: { package_id: pkg.id, exam_id: exam.id },
      },
      update: {},
      create: { package_id: pkg.id, exam_id: exam.id },
    });
    console.log(`PackageExam: ${pkg.title} -> ${exam.name}`);
  }

  // ---------------------------------------------------------------------
  // Test series under SSC CGL.
  // ---------------------------------------------------------------------
  const cgl = exams[0];
  const existingSeries = await prisma.testSeries.findFirst({
    where: { title: 'SSC CGL Full Mock Series', exam_id: cgl.id },
  });

  const series =
    existingSeries ??
    (await prisma.testSeries.create({
      data: {
        exam_id: cgl.id,
        title: 'SSC CGL Full Mock Series',
        type: 'practice',
        price: null,
        created_by: creator.id,
      },
    }));
  console.log(
    `TestSeries: ${series.title} (${existingSeries ? 'existing' : 'created'})`,
  );

  // ---------------------------------------------------------------------
  // Test under that series.
  // ---------------------------------------------------------------------
  const existingTest = await prisma.test.findFirst({
    where: { title: 'SSC CGL Mock Test 1', test_series_id: series.id },
  });

  const test =
    existingTest ??
    (await prisma.test.create({
      data: {
        test_series_id: series.id,
        title: 'SSC CGL Mock Test 1',
        duration_minutes: 60,
        marking_scheme: { correct: 2, incorrect: -0.5, unattempted: 0 },
        status: 'published',
      },
    }));
  console.log(`Test: ${test.title} (${existingTest ? 'existing' : 'created'})`);

  // ---------------------------------------------------------------------
  // Questions, linked to the test in order.
  // ---------------------------------------------------------------------
  for (const [index, seed] of QUESTIONS.entries()) {
    // question_text is the stable natural key for a seeded question.
    const existingQuestion = await prisma.question.findFirst({
      where: { question_text: seed.question_text },
    });

    const question =
      existingQuestion ??
      (await prisma.question.create({
        data: {
          subject: seed.subject,
          topic: seed.topic,
          difficulty: seed.difficulty,
          question_text: seed.question_text,
          options: seed.options,
          correct_option: seed.correct_option,
          explanation: seed.explanation,
          created_by: creator.id,
        },
      }));

    // TestQuestion has @@unique([test_id, question_id]).
    await prisma.testQuestion.upsert({
      where: {
        test_id_question_id: { test_id: test.id, question_id: question.id },
      },
      update: { sequence_order: index + 1, section: seed.subject },
      create: {
        test_id: test.id,
        question_id: question.id,
        sequence_order: index + 1,
        section: seed.subject,
      },
    });
  }
  console.log(`Questions: ${QUESTIONS.length} linked to ${test.title}`);

  console.log('\nSeed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
