import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, ManualPaymentType } from './entities/invoice.entity';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class InvoicesService {
  private logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly bookingsService: BookingsService,
  ) {}

  /**
   * Create a manual invoice for a tenant
   */
  async createInvoice(params: {
    tenantId: string;
    createdById: string;
    paymentType: ManualPaymentType;
    amount: number;
    currency?: string;
    dueDate?: Date;
    description?: string;
    notes?: string;
    bankDetails?: {
      accountNumber: string;
      routingNumber: string;
      bankName: string;
      accountHolder: string;
    };
  }): Promise<Invoice> {
    try {
      const invoiceNumber = await this.generateInvoiceNumber();

      const invoice = this.invoicesRepo.create({
        tenantId: params.tenantId,
        createdById: params.createdById,
        invoiceNumber,
        paymentType: params.paymentType,
        amount: params.amount,
        currency: params.currency || 'USD',
        dueDate: params.dueDate,
        description: params.description,
        notes: params.notes,
        status: InvoiceStatus.DRAFT,
        bankAccountNumber: params.bankDetails?.accountNumber,
        bankRoutingNumber: params.bankDetails?.routingNumber,
        bankName: params.bankDetails?.bankName,
        bankAccountHolder: params.bankDetails?.accountHolder,
      });

      const saved = await this.invoicesRepo.save(invoice);
      this.logger.log(`Invoice created: ${invoiceNumber} for tenant ${params.tenantId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create invoice: ${error.message}`);
      throw new BadRequestException('Failed to create invoice');
    }
  }

  /**
   * Send invoice to tenant via email
   */
  async sendInvoice(invoiceId: string, tenantEmail: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoice(invoiceId);

      // TODO: Generate PDF and send email
      // This would integrate with email service (SendGrid, etc.)
      // For now, we'll just mark as sent

      invoice.status = InvoiceStatus.SENT;
      invoice.sentToEmail = tenantEmail;
      invoice.emailSentAt = new Date();

      const saved = await this.invoicesRepo.save(invoice);
      this.logger.log(`Invoice sent: ${invoice.invoiceNumber} to ${tenantEmail}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to send invoice: ${error.message}`);
      throw new BadRequestException('Failed to send invoice');
    }
  }

  /**
   * Record a payment for an invoice (full or partial)
   */
  async recordPayment(params: {
    invoiceId: string;
    amount: number;
    referenceNumber?: string;
    notes?: string;
    approvedById?: string;
  }): Promise<{ invoice: Invoice; payment: Payment }> {
    try {
      const invoice = await this.getInvoice(params.invoiceId);

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot record payment for cancelled invoice');
      }

      const newAmountPaid = Number(invoice.amountPaid) + params.amount;
      const totalAmount = Number(invoice.amount);

      // Determine new status
      let newStatus = invoice.status;
      if (newAmountPaid >= totalAmount) {
        newStatus = InvoiceStatus.PAID;
      } else if (newAmountPaid > 0) {
        newStatus = InvoiceStatus.PARTIAL;
      } else if (invoice.dueDate && new Date() > invoice.dueDate && invoice.status === InvoiceStatus.PENDING) {
        newStatus = InvoiceStatus.OVERDUE;
      }

      // Create payment record
      const payment = this.paymentsRepo.create({
        tenantId: invoice.tenantId,
        amount: params.amount,
        currency: invoice.currency,
        paymentMethod: this.mapPaymentMethod(invoice.paymentType),
        status: PaymentStatus.COMPLETED,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          referenceNumber: params.referenceNumber,
        },
      });
      const savedPayment = await this.paymentsRepo.save(payment);

      // Update invoice
      invoice.amountPaid = newAmountPaid;
      invoice.status = newStatus;
      if (params.referenceNumber) {
        invoice.referenceNumber = params.referenceNumber;
      }
      if (newStatus === InvoiceStatus.PAID) {
        invoice.paidDate = new Date();
        if (params.approvedById) {
          invoice.approvedById = params.approvedById;
        }
        invoice.approvedAt = new Date();
        if (params.notes) {
          invoice.approvalNotes = params.notes;
        }
      }

      const savedInvoice = await this.invoicesRepo.save(invoice);
      this.logger.log(`Payment recorded for invoice ${invoice.invoiceNumber}: ${params.amount}`);

      return { invoice: savedInvoice, payment: savedPayment };
    } catch (error) {
      this.logger.error(`Failed to record payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark invoice as pending payment (approve for sending)
   */
  async approveSendInvoice(invoiceId: string, approvedById: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoice(invoiceId);

      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new BadRequestException('Only draft invoices can be approved for sending');
      }

      invoice.status = InvoiceStatus.PENDING;
      invoice.approvedById = approvedById;
      invoice.approvedAt = new Date();

      const saved = await this.invoicesRepo.save(invoice);
      this.logger.log(`Invoice approved for sending: ${invoice.invoiceNumber}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to approve invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoice(invoiceId);

      if ([InvoiceStatus.PAID, InvoiceStatus.REFUNDED].includes(invoice.status)) {
        throw new BadRequestException(`Cannot cancel ${invoice.status} invoice`);
      }

      invoice.status = InvoiceStatus.CANCELLED;
      invoice.metadata = { ...invoice.metadata, cancelReason: reason };

      const saved = await this.invoicesRepo.save(invoice);
      this.logger.log(`Invoice cancelled: ${invoice.invoiceNumber}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to cancel invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund an invoice (full or partial)
   */
  async refundInvoice(invoiceId: string, amount: number, reason: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoice(invoiceId);

      if (invoice.status !== InvoiceStatus.PAID) {
        throw new BadRequestException('Only paid invoices can be refunded');
      }

      const newAmountPaid = Number(invoice.amountPaid) - amount;

      if (newAmountPaid === 0) {
        invoice.status = InvoiceStatus.REFUNDED;
        invoice.paidDate = undefined;
      } else if (newAmountPaid > 0) {
        invoice.status = InvoiceStatus.PARTIAL;
      }

      invoice.amountPaid = newAmountPaid;
      invoice.metadata = { ...invoice.metadata, refundReason: reason, refundedAmount: amount };

      const saved = await this.invoicesRepo.save(invoice);
      this.logger.log(`Invoice refunded: ${invoice.invoiceNumber} (Amount: ${amount})`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to refund invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for overdue invoices and update status
   */
  async updateOverdueInvoices(): Promise<number> {
    const now = new Date();
    const result = await this.invoicesRepo
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: InvoiceStatus.OVERDUE })
      .where('due_date < :now', { now })
      .andWhere('status IN (:...statuses)', { statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] })
      .execute();

    this.logger.log(`Updated ${result.affected} invoices to overdue`);
    return result.affected || 0;
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoicesRepo.findOne({
      where: { id: invoiceId },
      relations: ['tenant', 'createdBy', 'approvedBy'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /**
   * Get invoices for a tenant
   */
  async getTenantInvoices(
    tenantId: string,
    page = 1,
    limit = 20,
    status?: InvoiceStatus,
  ) {
    let query = this.invoicesRepo.createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId });

    if (status) {
      query = query.andWhere('invoice.status = :status', { status });
    }

    const [invoices, total] = await query
      .orderBy('invoice.issuedDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get all pending/overdue invoices for admin
   */
  async getPendingInvoices(page = 1, limit = 20) {
    const [invoices, total] = await this.invoicesRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.tenant', 'tenant')
      .where('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIAL],
      })
      .orderBy('invoice.dueDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get payment history for invoice
   */
  async getInvoicePayments(invoiceId: string) {
    return this.paymentsRepo.find({
      where: {
        metadata: { invoiceId },
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoicesRepo.count();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Map manual payment type to payment method
   */
  private mapPaymentMethod(paymentType: ManualPaymentType): PaymentMethod {
    const mapping = {
      [ManualPaymentType.INVOICE]: PaymentMethod.BANK_TRANSFER,
      [ManualPaymentType.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
      [ManualPaymentType.CHECK]: PaymentMethod.BANK_TRANSFER,
      [ManualPaymentType.CASH]: PaymentMethod.WALLET,
      [ManualPaymentType.WIRE_TRANSFER]: PaymentMethod.BANK_TRANSFER,
      [ManualPaymentType.OTHER]: PaymentMethod.BANK_TRANSFER,
    };
    return mapping[paymentType] || PaymentMethod.BANK_TRANSFER;
  }
}
