import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe functionality will be disabled');
    }
  }

  /**
   * Create a payment intent for one-time booking payment
   */
  async createPaymentIntent(params: {
    amount: number; // in cents
    currency: string;
    bookingId: string;
    tenantId: string;
    customerId: string; // Stripe customer ID
    description: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        description: params.description,
        metadata: {
          bookingId: params.bookingId,
          tenantId: params.tenantId,
          ...params.metadata,
        },
        automatic_payment_methods: { enabled: true },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id} for booking ${params.bookingId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`);
      throw new BadRequestException('Failed to confirm payment intent');
    }
  }

  /**
   * Create or update a customer
   */
  async upsertCustomer(params: {
    email: string;
    name: string;
    userId: string;
    tenantId?: string;
  }): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      // Check if customer already exists
      const customers = await this.stripe.customers.list({
        email: params.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          userId: params.userId,
          tenantId: params.tenantId || 'N/A',
        },
      });

      this.logger.log(`Customer created: ${customer.id} for user ${params.userId}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to upsert customer: ${error.message}`);
      throw new BadRequestException('Failed to create or update customer');
    }
  }

  /**
   * Create a subscription for plan billing
   */
  async createSubscription(params: {
    customerId: string;
    priceId: string; // Stripe price ID for the plan
    tenantId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          tenantId: params.tenantId,
          ...params.metadata,
        },
      });

      this.logger.log(`Subscription created: ${subscription.id} for tenant ${params.tenantId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      throw new BadRequestException('Failed to retrieve subscription');
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    chargeId: string;
    amount?: number; // in cents, optional for full refund
    reason: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const refund = await this.stripe.refunds.create({
        charge: params.chargeId,
        amount: params.amount,
        reason: params.reason,
        metadata: params.metadata,
      });

      this.logger.log(`Refund created: ${refund.id} for charge ${params.chargeId}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new BadRequestException('Failed to create refund');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): Record<string, any> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }

      const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return event;
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Create a Stripe price/product for subscription plans
   * (Call this once during setup for each plan)
   */
  async createPlanPrice(params: {
    productName: string;
    priceAmount: number; // in cents
    currency: string;
    billingPeriod: 'month' | 'year';
  }): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      // Create product
      const product = await this.stripe.products.create({
        name: params.productName,
        type: 'service',
      });

      // Create price for the product
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: params.priceAmount,
        currency: params.currency.toLowerCase(),
        recurring: {
          interval: params.billingPeriod === 'year' ? 'year' : 'month',
        },
      });

      this.logger.log(`Plan price created - Product: ${product.id}, Price: ${price.id}`);
      return { product, price };
    } catch (error) {
      this.logger.error(`Failed to create plan price: ${error.message}`);
      throw new BadRequestException('Failed to create plan price');
    }
  }

  /**
   * Get available prices/plans
   */
  async getPrices(productId?: string): Promise<Stripe.Price[]> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
      });
      return prices.data;
    } catch (error) {
      this.logger.error(`Failed to get prices: ${error.message}`);
      throw new BadRequestException('Failed to retrieve prices');
    }
  }
}
