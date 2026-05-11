import {
  Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request, ParseUUIDPipe, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import {
  CreateManualInvoiceDto, RecordPaymentDto, SendInvoiceDto,
  RefundInvoiceDto, CancelInvoiceDto,
} from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InvoiceStatus } from './entities/invoice.entity';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * Create manual invoice (admin only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create manual invoice for tenant' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createInvoice(
    @Request() req: any,
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateManualInvoiceDto,
  ) {
    return this.invoicesService.createInvoice({
      tenantId,
      createdById: req.user.id,
      paymentType: dto.paymentType,
      amount: dto.amount,
      currency: dto.currency,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      description: dto.description,
      notes: dto.notes,
      bankDetails: dto.bankDetails,
    });
  }

  /**
   * Get invoices for a tenant
   */
  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get invoices for a tenant' })
  async getTenantInvoices(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.getTenantInvoices(tenantId, page, limit, status);
  }

  /**
   * Get all pending invoices (admin only)
   */
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending/overdue invoices (Admin)' })
  async getPendingInvoices(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.invoicesService.getPendingInvoices(page, limit);
  }

  /**
   * Get invoice details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.getInvoice(id);
  }

  /**
   * Get payment history for invoice
   */
  @Get(':id/payments')
  @ApiOperation({ summary: 'Get payment history for invoice' })
  async getInvoicePayments(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.getInvoicePayments(id);
  }

  /**
   * Send invoice to tenant (admin only)
   */
  @Post(':id/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send invoice to tenant email' })
  async sendInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendInvoiceDto,
  ) {
    return this.invoicesService.sendInvoice(id, dto.email);
  }

  /**
   * Approve invoice for sending (admin only)
   */
  @Put(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve invoice for sending' })
  async approveInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.invoicesService.approveSendInvoice(id, req.user.id);
  }

  /**
   * Record payment for invoice (admin only)
   */
  @Post(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Record payment for invoice' })
  async recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.invoicesService.recordPayment({
      invoiceId: id,
      amount: dto.amount,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
      approvedById: req.user.id,
    });
  }

  /**
   * Cancel invoice (admin only)
   */
  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel invoice' })
  async cancelInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.invoicesService.cancelInvoice(id, dto.reason);
  }

  /**
   * Refund invoice (admin only)
   */
  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Refund invoice (full or partial)' })
  async refundInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundInvoiceDto,
  ) {
    return this.invoicesService.refundInvoice(id, dto.amount, dto.reason);
  }
}
