import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';

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
    PrismaModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
})
export class AttemptsModule {}
