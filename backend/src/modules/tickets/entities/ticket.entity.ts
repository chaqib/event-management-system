import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum TicketType {
  FREE = 'free',
  REGULAR = 'regular',
  VIP = 'vip',
  EARLY_BIRD = 'early_bird',
  GROUP = 'group',
  STUDENT = 'student',
}

@Entity('tickets')
@Index(['tenantId'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.tickets)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TicketType, default: TicketType.REGULAR })
  type: TicketType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'quantity_total' })
  quantityTotal: number;

  @Column({ name: 'quantity_sold', default: 0 })
  quantitySold: number;

  @Column({ name: 'quantity_reserved', default: 0 })
  quantityReserved: number;

  @Column({ name: 'max_per_order', default: 10 })
  maxPerOrder: number;

  @Column({ name: 'sale_start_date', nullable: true })
  saleStartDate: Date;

  @Column({ name: 'sale_end_date', nullable: true })
  saleEndDate: Date;

  @Column({ type: 'jsonb', default: [] })
  benefits: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
