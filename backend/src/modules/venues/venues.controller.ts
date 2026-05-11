import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, Request, ParseUUIDPipe, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { Venue } from './entities/venue.entity';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all venues' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('city') city?: string, @Query('tenantId') tenantId?: string) {
    return this.venuesService.findAll(page, limit, city, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a venue' })
  async create(@Request() req: any, @Body() data: Partial<Venue>, @Headers('x-tenant-id') tenantId?: string) {
    return this.venuesService.create({ ...data, createdBy: req.user.id, tenantId });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a venue' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<Venue>) {
    return this.venuesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a venue' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.delete(id);
  }
}
