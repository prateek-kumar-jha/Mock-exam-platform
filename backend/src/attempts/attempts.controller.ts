import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionThrottlerGuard } from '../common/session-throttler.guard';

/** JWT payload shape set by JwtAuthGuard. */
type AuthedRequest = { user?: { sub?: string } };

// JwtAuthGuard runs first so the throttler can key on the authenticated user.
@Controller('api/v1')
@UseGuards(JwtAuthGuard, SessionThrottlerGuard)
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

  /** Auto-save: called on every answer selection and navigation change. */
  @Put('attempts/:attemptId/answers/:questionId')
  saveAnswer(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: SaveAnswerDto,
    @Request() req: AuthedRequest,
  ) {
    return this.attemptsService.saveAnswer(
      attemptId,
      questionId,
      this.userIdOf(req),
      dto,
    );
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Request() req: AuthedRequest,
  ) {
    return this.attemptsService.submitAttempt(attemptId, this.userIdOf(req));
  }
}
