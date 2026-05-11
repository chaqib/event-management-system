import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Venue } from '../../venues/entities/venue.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum EventCategory {
  CONFERENCE = 'conference',
  CONCERT = 'concert',
  SPORTS = 'sports',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  SOCIAL = 'social',
  NETWORKING = 'networking',
  EXHIBITION = 'exhibition',
  FESTIVAL = 'festival',
  OTHER = 'other',
}

@Entity('events')
@Index(['tenantId'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'organizer_id' })
  organizerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ name: 'venue_id', nullable: true })
  venueId: string;

  @ManyToOne(() => Venue, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'short_description', nullable: true })
  shortDescription: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'enum', enum: EventCategory, default: EventCategory.OTHER })
  category: EventCategory;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ name: 'online_url', nullable: true })
  onlineUrl: string;

  @Column({ name: 'max_capacity', nullable: true })
  maxCapacity: number;

  @Column({ name: 'current_attendees', default: 0 })
  currentAttendees: number;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_free', default: false })
  isFree: boolean;

  @Column({ name: 'min_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minPrice: number;

  @Column({ name: 'max_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  maxPrice: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'refund_policy', type: 'text', nullable: true })
  refundPolicy: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
