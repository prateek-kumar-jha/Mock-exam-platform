import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

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
          ],
        };
      },
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}