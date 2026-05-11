import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus, SubscriptionPlan } from './entities/tenant.entity';
import { StripeService } from '../payments/stripe.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

// Stripe Price IDs for each plan (set these after creating prices in Stripe Dashboard)
const STRIPE_PRICE_IDS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE_TRIAL]: '', // Free tier, no price ID needed
  [SubscriptionPlan.STARTER]: process.env.STRIPE_PRICE_STARTER || '',
  [SubscriptionPlan.PRO]: process.env.STRIPE_PRICE_PRO || '',
  [SubscriptionPlan.ENTERPRISE]: process.env.STRIPE_PRICE_ENTERPRISE || '',
};

const PLAN_DETAILS: Record<SubscriptionPlan, {
  name: string;
  monthlyPrice: number;
  maxEvents: number;
  maxAttendees: number;
  maxTeam: number;
  platformFee: number;
}> = {
  [SubscriptionPlan.FREE_TRIAL]: {
    name: 'Free Trial',
    monthlyPrice: 5.00, // One-time trial fee
    maxEvents: 3,
    maxAttendees: 100,
    maxTeam: 2,
    platformFee: 5.00,
  },
  [SubscriptionPlan.STARTER]: {
    name: 'Starter',
    monthlyPrice: 29.00,
    maxEvents: 10,
    maxAttendees: 500,
    maxTeam: 3,
    platformFee: 3.00,
  },
  [SubscriptionPlan.PRO]: {
    name: 'Pro',
    monthlyPrice: 79.00,
    maxEvents: 50,
    maxAttendees: 5000,
    maxTeam: 10,
    platformFee: 2.00,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: 'Enterprise',
    monthlyPrice: 0, // Custom pricing
    maxEvents: -1, // Unlimited
    maxAttendees: -1, // Unlimited
    maxTeam: -1, // Unlimited
    platformFee: 1.00,
  },
};

@Injectable()
export class SubscriptionsService {
  private logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upgrade tenant from trial to a paid plan
   */
  async upgradeToTrial(tenantId: string): Promise<Tenant> {
    try {
      const tenant = await this.getTenant(tenantId);

      if (tenant.subscriptionPlan !== SubscriptionPlan.FREE_TRIAL) {
        throw new BadRequestException('Tenant is not on free trial');
      }

      // Trial status doesn't change, just update subscription period
      tenant.subscriptionStartsAt = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // 14 days
      tenant.subscriptionEndsAt = endDate;

      const saved = await this.tenantsRepo.save(tenant);
      this.logger.log(`Tenant upgraded to trial: ${tenantId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to upgrade to trial: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upgrade tenant to a paid plan with Stripe subscription
   */
  async upgradePlan(
    tenantId: string,
    newPlan: SubscriptionPlan,
    paymentMethodId?: string,
  ): Promise<{ tenant: Tenant; subscriptionId?: string; clientSecret?: string }> {
    try {
      if (newPlan === SubscriptionPlan.FREE_TRIAL) {
        throw new BadRequestException('Cannot upgrade to free trial');
      }

      const tenant = await this.getTenant(tenantId);
      const owner = await this.usersService.findById(tenant.ownerId);

      if (!owner) {
        throw new NotFoundException('Tenant owner not found');
      }

      // Ensure owner has Stripe customer
      let stripeCustomerId = owner.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripeService.upsertCustomer({
          email: owner.email,
          name: `${owner.firstName} ${owner.lastName}`,
          userId: owner.id,
          tenantId,
        });
        stripeCustomerId = customer.id;
        await this.usersService.updateStripeCustomerId(owner.id, stripeCustomerId);
      }

      const priceId = STRIPE_PRICE_IDS[newPlan];
      if (!priceId) {
        throw new BadRequestException(`Stripe price ID not configured for ${newPlan} plan`);
      }

      // Create subscription
      const subscription = await this.stripeService.createSubscription({
        customerId: stripeCustomerId,
        priceId,
        tenantId,
        metadata: { tenantName: tenant.name, planName: newPlan },
      });

      // Update tenant
      const planDetails = PLAN_DETAILS[newPlan];
      tenant.subscriptionPlan = newPlan;
      tenant.status = TenantStatus.ACTIVE;
      tenant.subscriptionStartsAt = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      tenant.subscriptionEndsAt = endDate;
      tenant.maxEvents = planDetails.maxEvents;
      tenant.maxAttendeesPerEvent = planDetails.maxAttendees;
      tenant.maxTeamMembers = planDetails.maxTeam;
      tenant.platformFeePercentage = planDetails.platformFee;

      // Store Stripe subscription ID in tenant metadata
      tenant.settings = {
        ...tenant.settings,
        stripeSubscriptionId: subscription.id,
      };

      const savedTenant = await this.tenantsRepo.save(tenant);
      this.logger.log(`Tenant upgraded to ${newPlan}: ${tenantId} (Subscription: ${subscription.id})`);

      return {
        tenant: savedTenant,
        subscriptionId: subscription.id,
      };
    } catch (error) {
      this.logger.error(`Failed to upgrade plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Downgrade tenant plan
   */
  async downgradePlan(tenantId: string, newPlan: SubscriptionPlan): Promise<Tenant> {
    try {
      const tenant = await this.getTenant(tenantId);

      // Cancel current Stripe subscription
      const subscriptionId = tenant.settings?.stripeSubscriptionId;
      if (subscriptionId) {
        await this.stripeService.cancelSubscription(subscriptionId);
      }

      // Update tenant
      const planDetails = PLAN_DETAILS[newPlan];
      tenant.subscriptionPlan = newPlan;
      tenant.maxEvents = planDetails.maxEvents;
      tenant.maxAttendeesPerEvent = planDetails.maxAttendees;
      tenant.maxTeamMembers = planDetails.maxTeam;
      tenant.platformFeePercentage = planDetails.platformFee;
      tenant.settings = { ...tenant.settings, stripeSubscriptionId: null };

      const saved = await this.tenantsRepo.save(tenant);
      this.logger.log(`Tenant downgraded to ${newPlan}: ${tenantId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to downgrade plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle subscription renewal via webhook
   */
  async handleSubscriptionRenewal(subscriptionId: string): Promise<Tenant> {
    try {
      const subscription = await this.stripeService.getSubscription(subscriptionId);
      const tenantId = subscription.metadata?.tenantId;

      if (!tenantId) {
        throw new BadRequestException('Subscription missing tenant ID in metadata');
      }

      const tenant = await this.getTenant(tenantId);
      
      // Extend subscription end date
      const newEndDate = new Date(subscription.current_period_end * 1000);
      tenant.subscriptionEndsAt = newEndDate;

      const saved = await this.tenantsRepo.save(tenant);
      this.logger.log(`Subscription renewed for tenant: ${tenantId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to handle subscription renewal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle subscription cancellation via webhook
   */
  async handleSubscriptionCancellation(subscriptionId: string): Promise<Tenant> {
    try {
      const subscription = await this.stripeService.getSubscription(subscriptionId);
      const tenantId = subscription.metadata?.tenantId;

      if (!tenantId) {
        throw new BadRequestException('Subscription missing tenant ID in metadata');
      }

      const tenant = await this.getTenant(tenantId);
      
      // Revert to trial
      tenant.subscriptionPlan = SubscriptionPlan.FREE_TRIAL;
      tenant.status = TenantStatus.TRIAL;
      tenant.subscriptionEndsAt = undefined;
      tenant.settings = { ...tenant.settings, stripeSubscriptionId: null };

      const planDetails = PLAN_DETAILS[SubscriptionPlan.FREE_TRIAL];
      tenant.maxEvents = planDetails.maxEvents;
      tenant.maxAttendeesPerEvent = planDetails.maxAttendees;
      tenant.maxTeamMembers = planDetails.maxTeam;
      tenant.platformFeePercentage = planDetails.platformFee;

      const saved = await this.tenantsRepo.save(tenant);
      this.logger.log(`Subscription cancelled for tenant: ${tenantId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to handle subscription cancellation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get plan details
   */
  getPlanDetails(plan: SubscriptionPlan) {
    return PLAN_DETAILS[plan];
  }

  /**
   * Get all plan details
   */
  getAllPlans() {
    return Object.entries(PLAN_DETAILS).map(([key, value]) => ({
      plan: key,
      ...value,
    }));
  }

  /**
   * Check if tenant has exceeded plan limits
   */
  async checkPlanLimits(tenantId: string, eventCount: number, attendeeCount: number, teamCount: number): Promise<{
    isValid: boolean;
    violations: string[];
  }> {
    const tenant = await this.getTenant(tenantId);
    const violations: string[] = [];

    if (tenant.maxEvents !== -1 && eventCount > tenant.maxEvents) {
      violations.push(`Event limit exceeded: ${eventCount}/${tenant.maxEvents}`);
    }

    if (tenant.maxAttendeesPerEvent !== -1 && attendeeCount > tenant.maxAttendeesPerEvent) {
      violations.push(`Attendee limit exceeded: ${attendeeCount}/${tenant.maxAttendeesPerEvent}`);
    }

    if (tenant.maxTeamMembers !== -1 && teamCount > tenant.maxTeamMembers) {
      violations.push(`Team member limit exceeded: ${teamCount}/${tenant.maxTeamMembers}`);
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  private async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
