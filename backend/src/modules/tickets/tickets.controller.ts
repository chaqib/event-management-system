import {
  Controller, Get, Post, Put, Delete, Param, Body,
  UseGuards, ParseUUIDPipe, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get tickets for an event' })
  async findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.ticketsService.findByEvent(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a ticket tier' })
  async create(@Body() dto: CreateTicketDto, @Headers('x-tenant-id') tenantId?: string) {
    return this.ticketsService.create({ ...dto, tenantId });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a ticket' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<CreateTicketDto>) {
    return this.ticketsService.update(id, data as Partial<Ticket>);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a ticket tier' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.delete(id);
  }
}
