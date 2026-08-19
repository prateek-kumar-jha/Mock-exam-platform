import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthThrottlerGuard } from '../common/auth-throttler.guard';

/** JWT payload shape set by JwtAuthGuard. */
type AuthedRequest = { user?: { sub?: string } };

@Controller('api/v1')
@UseGuards(AuthThrottlerGuard, JwtAuthGuard)
export class AttemptsController {
  constructor(private attemptsService: AttemptsService) {}

  /** The attempt owner always comes from the verified token, never the body. */
  private userIdOf(req: AuthedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }
    return userId;
  }

  @Post('tests/:testId/attempts')
  startAttempt(
    // ParseUUIDPipe rejects malformed ids before they reach the database.
    @Param('testId', ParseUUIDPipe) testId: string,
    @Request() req: AuthedRequest,
  ) {
    return this.attemptsService.startAttempt(testId, this.userIdOf(req));
  }

  @Get('attempts/:attemptId')
  getAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Request() req: AuthedRequest,
  ) {
    return this.attemptsService.getAttempt(attemptId, this.userIdOf(req));
  }
}
