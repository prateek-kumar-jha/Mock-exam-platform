import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AttemptsProcessor } from './attempts.processor';
import { ATTEMPTS_QUEUE } from './attempts.queue';

@Module({
  imports: [
    ConfigModule,
    // JwtAuthGuard verifies tokens itself, so JwtService must be available.
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: ATTEMPTS_QUEUE }),
    PrismaModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsProcessor],
})
export class AttemptsModule {}
