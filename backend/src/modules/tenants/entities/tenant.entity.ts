import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { TenantUser } from './tenant-user.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum SubscriptionPlan {
  FREE_TRIAL = 'free_trial',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  website: string;

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.TRIAL })
  status: TenantStatus;

  @Column({ name: 'subscription_plan', type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE_TRIAL })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'trial_ends_at', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'subscription_starts_at', nullable: true })
  subscriptionStartsAt: Date;

  @Column({ name: 'subscription_ends_at', nullable: true })
  subscriptionEndsAt?: Date;

  // Plan limits
  @Column({ name: 'max_events', default: 5 })
  maxEvents: number;

  @Column({ name: 'max_attendees_per_event', default: 500 })
  maxAttendeesPerEvent: number;

  @Column({ name: 'max_team_members', default: 2 })
  maxTeamMembers: number;

  @Column({ name: 'platform_fee_percentage', type: 'decimal', precision: 5, scale: 2, default: 5.00 })
  platformFeePercentage: number;

  // Branding
  @Column({ name: 'primary_color', default: '#6366f1' })
  primaryColor: string;

  @Column({ name: 'custom_domain', nullable: true, unique: true })
  customDomain: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @OneToMany(() => TenantUser, (tu) => tu.tenant)
  members: TenantUser[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
