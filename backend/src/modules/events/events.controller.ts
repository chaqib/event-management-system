import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, Request, ParseUUIDPipe, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { EventCategory, EventStatus } from './entities/event.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published events' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', enum: EventCategory, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isFree', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: EventCategory,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isFree') isFree?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.eventsService.findAll(tenantId || null, { page, limit, category, search, startDate, endDate, isFree, isFeatured });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured events' })
  async getFeatured(@Query('limit') limit = 6) {
    return this.eventsService.getFeatured(limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event statistics (Admin)' })
  async getStats() {
    return this.eventsService.getStats();
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my events (Organizer)' })
  async getMyEvents(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.eventsService.findByOrganizer(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get event by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant ID' })
  async create(@Request() req: any, @Body() dto: CreateEventDto, @Headers('x-tenant-id') tenantId: string) {
    return this.eventsService.create(tenantId, req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, req.user.id, req.user.role, dto);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish an event' })
  async publish(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.eventsService.publish(id, req.user.id);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an event' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.eventsService.cancel(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.eventsService.delete(id, req.user.id, req.user.role);
  }
}
