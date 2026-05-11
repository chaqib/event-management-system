import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, ParseUUIDPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from './dto/payment.dto';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a Stripe payment intent for a booking
   * Returns: { paymentId, clientSecret, amount }
   * clientSecret is used on frontend to confirm payment with Stripe
   */
  @Post('intent')
  @ApiOperation({ summary: 'Create payment intent for booking (Stripe)' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createPaymentIntent(
    @Request() req: any,
    @Body() dto: CreatePaymentIntentDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.createPaymentIntent(tenantId, dto.bookingId, req.user.id);
  }

  /**
   * Confirm payment after Stripe processing
   */
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm payment after Stripe processing' })
  async confirmPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirmPayment(id, dto.stripePaymentIntentId);
  }

  /**
   * Refund a completed payment
   */
  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a completed payment' })
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, dto.amount);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all payments (Admin)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('tenantId') tenantId?: string) {
    return this.paymentsService.findAll(page, limit, tenantId);
  }

  @Get('revenue/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get revenue statistics' })
  async getRevenueStats(@Query('tenantId') tenantId?: string) {
    return this.paymentsService.getRevenueStats(tenantId);
  }

  @Get('revenue/by-date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get revenue by date range' })
  async getRevenueByDate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.paymentsService.getRevenueByDateRange(
      new Date(startDate),
      new Date(endDate),
      tenantId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findById(id);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get payments for a booking' })
  async findByBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }
}
