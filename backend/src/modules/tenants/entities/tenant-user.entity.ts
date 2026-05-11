import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum TenantRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EVENT_COORDINATOR = 'event_coordinator',
  FINANCE = 'finance',
  SUPPORT = 'support',
  VIEWER = 'viewer',
}

@Entity('tenant_users')
@Unique(['tenantId', 'userId'])
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, (t) => t.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'tenant_role', type: 'enum', enum: TenantRole, default: TenantRole.VIEWER })
  tenantRole: TenantRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy: string;

  @Column({ name: 'joined_at', nullable: true })
  joinedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
