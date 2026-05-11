import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ManualPaymentType, InvoiceStatus } from '../entities/invoice.entity';

export class CreateManualInvoiceDto {
  @IsEnum(ManualPaymentType)
  paymentType: ManualPaymentType;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountHolder: string;
  };
}

export class RecordPaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SendInvoiceDto {
  @IsString()
  email: string;
}

export class RefundInvoiceDto {
  @IsNumber()
  amount: number;

  @IsString()
  reason: string;
}

export class CancelInvoiceDto {
  @IsString()
  reason: string;
}

export class InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  paymentType: ManualPaymentType;
  status: InvoiceStatus;
  amount: number;
  amountPaid: number;
  currency: string;
  dueDate: Date;
  issuedDate: Date;
  paidDate: Date;
  description: string;
  notes: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  checkNumber: string;
  sentToEmail: string;
  emailSentAt: Date;
  referenceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
