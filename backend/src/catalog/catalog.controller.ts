import { Controller, Get, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthThrottlerGuard } from '../common/auth-throttler.guard';

/**
 * Versioned per 06-Implementation-Roadmap.md ("Versioned API paths from day
 * one"). Behind the same auth and rate-limiting layer as every other route —
 * no exceptions for read-only endpoints.
 */
@Controller('api/v1')
@UseGuards(AuthThrottlerGuard, JwtAuthGuard)
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('packages')
  listPackages() {
    return this.catalogService.listPackages();
  }

  @Get('tests')
  listTests() {
    return this.catalogService.listTests();
  }
}
