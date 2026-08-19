import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma only auto-discovers this file at the package root, so it lives here
// rather than in prisma/. The connection string comes from .env — never from
// schema.prisma, which no longer supports an inline url.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // Prisma 7 reads the seed command from here; a `prisma.seed` entry in
    // package.json is no longer honoured.
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
