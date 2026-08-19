import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Mirrors the AnswerStatus enum in schema.prisma. Declared explicitly rather
 * than imported from @prisma/client so class-validator has a real runtime
 * object to check against — an arbitrary string is rejected, not coerced.
 */
export enum AnswerStatusDto {
  answered = 'answered',
  marked_for_review = 'marked_for_review',
  not_visited = 'not_visited',
}

export class SaveAnswerDto {
  /** Null/absent means the student cleared their choice (unattempted). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  selected_option?: string | null;

  @IsEnum(AnswerStatusDto)
  status!: AnswerStatusDto;

  /**
   * Client-reported, used for analytics only — never for scoring or for
   * deciding whether the attempt is still open. Capped so a bad client can't
   * store an absurd value.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  time_spent_seconds?: number;
}
