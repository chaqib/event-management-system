import { Controller, Post, Body, Headers, RawBody, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @RawBody() body: string,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      const event = this.stripeService.verifyWebhookSignature(body, signature);
      this.logger.log(`Webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          this.logger.debug(`Unhandled webhook type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any) {
    try {
      const bookingId = paymentIntent.metadata?.bookingId;
      if (!bookingId) {
        this.logger.warn('Payment intent missing bookingId in metadata');
        return;
      }

      // Find and confirm payment
      const payment = await this.paymentsService.findByStripePaymentIntent(paymentIntent.id);
      await this.paymentsService.confirmPayment(payment.id, paymentIntent.id);

      this.logger.log(`Payment succeeded for booking: ${bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to handle payment success: ${error.message}`);
    }
  }

  private async handlePaymentFailed(paymentIntent: any) {
    try {
      const bookingId = paymentIntent.metadata?.bookingId;
      if (!bookingId) {
        this.logger.warn('Payment intent missing bookingId in metadata');
        return;
      }

      // Find and mark payment as failed
      const payment = await this.paymentsService.findByStripePaymentIntent(paymentIntent.id);
      const reason = paymentIntent.last_payment_error?.message || 'Payment declined';
      await this.paymentsService.failPayment(payment.id, reason);

      this.logger.log(`Payment failed for booking: ${bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to handle payment failure: ${error.message}`);
    }
  }

  private async handleChargeRefunded(charge: any) {
    try {
      this.logger.log(`Charge refunded: ${charge.id}, Amount: ${charge.amount_refunded}`);
      // Additional refund tracking can be added here
    } catch (error) {
      this.logger.error(`Failed to handle charge refund: ${error.message}`);
    }
  }

  private async handleSubscriptionUpdated(subscription: any) {
    try {
      const tenantId = subscription.metadata?.tenantId;
      this.logger.log(`Subscription updated: ${subscription.id} for tenant: ${tenantId}`);
      // Update tenant subscription status if needed
    } catch (error) {
      this.logger.error(`Failed to handle subscription update: ${error.message}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: any) {
    try {
      const tenantId = subscription.metadata?.tenantId;
      this.logger.log(`Subscription deleted: ${subscription.id} for tenant: ${tenantId}`);
      // Downgrade tenant to trial if needed
    } catch (error) {
      this.logger.error(`Failed to handle subscription deletion: ${error.message}`);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any) {
    try {
      const subscriptionId = invoice.subscription;
      this.logger.log(`Invoice payment succeeded: ${invoice.id} for subscription: ${subscriptionId}`);
      // Update subscription status if needed
    } catch (error) {
      this.logger.error(`Failed to handle invoice payment success: ${error.message}`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    try {
      const subscriptionId = invoice.subscription;
      this.logger.log(`Invoice payment failed: ${invoice.id} for subscription: ${subscriptionId}`);
      // Implement dunning (retry logic) or suspension
    } catch (error) {
      this.logger.error(`Failed to handle invoice payment failure: ${error.message}`);
    }
  }
}
