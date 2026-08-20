import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { AttemptsModule } from './attempts/attempts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const windowMs = Number(
          config.get<string>('RATE_LIMIT_WINDOW_MS') ?? 900_000,
        );
        return {
          throttlers: [
            {
              // Per-IP: caps how much any single host can hammer auth routes.
              name: 'ip',
              ttl: windowMs,
              limit: Number(config.get<string>('RATE_LIMIT_IP_MAX') ?? 20),
            },
            {
              // Per-account: caps attempts against one identifier regardless of
              // how many source IPs they arrive from.
              name: 'account',
              ttl: windowMs,
              limit: Number(config.get<string>('RATE_LIMIT_ACCOUNT_MAX') ?? 5),
              getTracker: (req: Record<string, any>) => {
                const email = req?.body?.email;
                return typeof email === 'string' && email.length > 0
                  ? `account:${email.toLowerCase()}`
                  : `account-anon:${req.ip ?? 'unknown'}`;
              },
            },
            {
              // Authenticated app traffic. Auto-save fires on every answer and
              // navigation change, so an auth-strict cap would lock a student
              // out mid-exam. Still bounded, just far looser.
              name: 'session',
              ttl: windowMs,
              limit: Number(
                config.get<string>('RATE_LIMIT_SESSION_MAX') ?? 600,
              ),
            },
          ],
        };
      },
    }),
    // Shared Redis connection for all BullMQ queues.
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get<string>('REDIS_PORT') ?? 6379),

          // Fail fast and loud on a genuine outage. Without these, ioredis
          // retries forever with an unbounded queue of pending commands,
          // which can exhaust the heap instead of surfacing the problem.
          maxRetriesPerRequest: Number(
            config.get<string>('REDIS_MAX_RETRIES_PER_REQUEST') ?? 3,
          ),
          // Cap the reconnect backoff instead of growing it without limit,
          // and stop retrying the initial connect after a bounded number of
          // attempts so startup surfaces a clear error.
          retryStrategy: (times: number) => {
            const maxAttempts = Number(
              config.get<string>('REDIS_MAX_RECONNECT_ATTEMPTS') ?? 10,
            );
            if (times > maxAttempts) return null;
            return Math.min(times * 500, 5_000);
          },
          // Surface command errors rather than buffering them indefinitely
          // while the connection is down.
          enableOfflineQueue: false,
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    AttemptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}