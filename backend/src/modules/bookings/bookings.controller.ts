import {
  Controller, Get, Post, Put, Param, Body, Query,
  UseGuards, Request, ParseUUIDPipe, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { BookingStatus } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async create(@Request() req: any, @Body() dto: CreateBookingDto, @Headers('x-tenant-id') tenantId: string) {
    return this.bookingsService.create(tenantId, req.user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  @ApiQuery({ name: 'eventId', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: BookingStatus,
    @Query('eventId') eventId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.bookingsService.findAll({ page, limit, status, eventId, tenantId });
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get my bookings' })
  async getMyBookings(@Request() req: any, @Query('page') page = 1) {
    return this.bookingsService.findByUser(req.user.id, page);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Get booking statistics' })
  async getStats() {
    return this.bookingsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findById(id);
  }

  @Get('number/:bookingNumber')
  @ApiOperation({ summary: 'Get booking by booking number' })
  async findByNumber(@Param('bookingNumber') bookingNumber: string) {
    return this.bookingsService.findByBookingNumber(bookingNumber);
  }

  @Put(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Confirm a booking' })
  async confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.confirm(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, req.user.id, reason);
  }

  @Put(':id/check-in')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Check in a booking' })
  async checkIn(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.checkIn(id);
  }
}
