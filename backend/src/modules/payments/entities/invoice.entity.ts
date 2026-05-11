import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum ManualPaymentType {
  INVOICE = 'invoice',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CASH = 'cash',
  WIRE_TRANSFER = 'wire_transfer',
  OTHER = 'other',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PENDING = 'pending', // Awaiting payment
  PARTIAL = 'partial', // Partial payment received
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('invoices')
@Index(['tenantId'])
@Index(['status'])
@Index(['dueDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string; // e.g., INV-2026-001

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ type: 'enum', enum: ManualPaymentType })
  paymentType: ManualPaymentType;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ name: 'issued_date', default: () => 'CURRENT_TIMESTAMP' })
  issuedDate: Date;

  @Column({ name: 'paid_date', nullable: true })
  paidDate?: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Bank transfer details
  @Column({ name: 'bank_account_number', nullable: true })
  bankAccountNumber: string;

  @Column({ name: 'bank_routing_number', nullable: true })
  bankRoutingNumber: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'bank_account_holder', nullable: true })
  bankAccountHolder: string;

  // Check payment details
  @Column({ name: 'check_number', nullable: true })
  checkNumber: string;

  @Column({ name: 'check_received_date', nullable: true })
  checkReceivedDate: Date;

  // Invoice file
  @Column({ name: 'invoice_pdf_url', nullable: true })
  invoicePdfUrl: string;

  @Column({ name: 'sent_to_email', nullable: true })
  sentToEmail: string;

  @Column({ name: 'email_sent_at', nullable: true })
  emailSentAt: Date;

  // Approval workflow
  @Column({ name: 'approved_by_id', nullable: true })
  approvedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approval_notes', type: 'text', nullable: true })
  approvalNotes: string;

  // Payment reference (for tracking)
  @Column({ name: 'reference_number', nullable: true })
  referenceNumber: string; // e.g., transaction ID, check #

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
