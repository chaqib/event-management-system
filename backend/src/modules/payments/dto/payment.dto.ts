import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentIntentDto {
  @IsString()
  bookingId: string;

  @IsString()
  tenantId: string;
}

export class ConfirmPaymentDto {
  @IsString()
  stripePaymentIntentId: string;
}

export class RefundPaymentDto {
  @IsNumber()
  @IsOptional()
  amount?: number;
}

export class CreateSubscriptionDto {
  @IsString()
  priceId: string; // Stripe price ID

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class UpdateSubscriptionDto {
  @IsString()
  newPriceId: string;
}

export class PaymentResponseDto {
  id: string;
  tenantId: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: string;
  stripePaymentIntentId: string;
  stripeChargeId: string;
  receiptUrl: string;
  refundAmount: number;
  refundedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
