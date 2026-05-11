import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request, ParseUUIDPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get reviews for an event' })
  async findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string, @Query('page') page = 1) {
    return this.reviewsService.findByEvent(eventId, page);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  async create(
    @Request() req: any,
    @Body() body: { eventId: string; rating: number; title?: string; comment?: string },
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.reviewsService.create(tenantId, req.user.id, body.eventId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.delete(id);
  }
}
