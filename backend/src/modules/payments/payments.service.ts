import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { BookingsService } from '../bookings/bookings.service';
import { StripeService } from './stripe.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly bookingsService: BookingsService,
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a payment intent with Stripe for a booking
   */
  async createPaymentIntent(tenantId: string, bookingId: string, userId: string): Promise<{
    paymentId: string;
    clientSecret: string;
    amount: number;
  }> {
    try {
      const booking = await this.bookingsService.findById(bookingId);
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Ensure user has a Stripe customer ID
      let stripeCustomer = user.stripeCustomerId;
      if (!stripeCustomer) {
        const customer = await this.stripeService.upsertCustomer({
          email: user.email || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`,
          userId: user.id,
          tenantId,
        });
        stripeCustomer = customer.id;
        // Update user with Stripe customer ID
        await this.usersService.updateStripeCustomerId(userId, stripeCustomer);
      }

      // Create payment intent
      const amountInCents = Math.round(Number(booking.totalAmount) * 100);
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: amountInCents,
        currency: booking.currency,
        bookingId,
        tenantId,
        customerId: stripeCustomer,
        description: `Booking for event: ${booking.eventId}`,
      });

      // Create payment record
      const payment = this.paymentsRepository.create({
        tenantId,
        bookingId,
        userId,
        amount: booking.totalAmount,
        currency: booking.currency,
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: paymentIntent.id,
      });
      const savedPayment = await this.paymentsRepository.save(payment);

      this.logger.log(`Payment intent created for booking ${bookingId}`);

      if (!paymentIntent.client_secret) {
        throw new BadRequestException('Failed to generate payment client secret');
      }

      return {
        paymentId: savedPayment.id,
        clientSecret: paymentIntent.client_secret,
        amount: amountInCents,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment after Stripe completes payment
   */
  async confirmPayment(paymentId: string, stripePaymentIntentId: string): Promise<Payment> {
    try {
      const payment = await this.findById(paymentId);

      // Verify payment intent was successful
      const paymentIntent = await this.stripeService.confirmPaymentIntent(stripePaymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment intent did not succeed');
      }

      payment.status = PaymentStatus.COMPLETED;
      payment.stripeChargeId = paymentIntent.latest_charge as string;
      const saved = await this.paymentsRepository.save(payment);

      // Confirm the booking
      await this.bookingsService.confirm(payment.bookingId);

      this.logger.log(`Payment confirmed: ${paymentId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to confirm payment: ${error.message}`);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  /**
   * Handle failed payment
   */
  async failPayment(paymentId: string, reason: string): Promise<Payment> {
    const payment = await this.findById(paymentId);
    payment.status = PaymentStatus.FAILED;
    payment.metadata = { ...payment.metadata, failureReason: reason };
    const saved = await this.paymentsRepository.save(payment);
    this.logger.log(`Payment failed: ${paymentId} - ${reason}`);
    return saved;
  }

  /**
   * Refund a completed payment
   */
  async refundPayment(paymentId: string, partialAmount?: number): Promise<Payment> {
    try {
      const payment = await this.findById(paymentId);

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Only completed payments can be refunded');
      }

      if (!payment.stripeChargeId) {
        throw new BadRequestException('No Stripe charge ID found for refund');
      }

      const refundAmountCents = partialAmount ? Math.round(partialAmount * 100) : undefined;

      const refund = await this.stripeService.createRefund({
        chargeId: payment.stripeChargeId,
        amount: refundAmountCents,
        reason: 'requested_by_customer',
      });

      // Update payment record
      const isPartialRefund = refundAmountCents && refundAmountCents < Math.round(Number(payment.amount) * 100);
      payment.status = isPartialRefund ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED;
      payment.refundAmount = partialAmount || payment.amount;
      payment.refundedAt = new Date();
      payment.metadata = { ...payment.metadata, stripeRefundId: refund.id };

      const saved = await this.paymentsRepository.save(payment);
      this.logger.log(`Payment refunded: ${paymentId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${error.message}`);
      throw new BadRequestException('Failed to refund payment');
    }
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['booking', 'user'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findByStripePaymentIntent(stripePaymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { stripePaymentIntentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findByBooking(bookingId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({ where: { bookingId }, relations: ['user'] });
  }

  async findAll(page = 1, limit = 20, tenantId?: string) {
    const qb = this.paymentsRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('payment.user', 'user');

    if (tenantId) qb.andWhere('payment.tenantId = :tenantId', { tenantId });

    const [payments, total] = await qb
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRevenueStats(tenantId?: string) {
    let qb = this.paymentsRepository.createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'totalRevenue')
      .addSelect('COUNT(*)', 'totalTransactions')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (tenantId) {
      qb = qb.andWhere('payment.tenantId = :tenantId', { tenantId });
    }

    return qb.getRawOne();
  }

  async getRevenueByDateRange(startDate: Date, endDate: Date, tenantId?: string) {
    let qb = this.paymentsRepository.createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(payment.createdAt)')
      .orderBy('DATE(payment.createdAt)', 'DESC');

    if (tenantId) {
      qb = qb.andWhere('payment.tenantId = :tenantId', { tenantId });
    }

    return qb.getRawMany();
  }
}
