import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Event, EventStatus, EventCategory } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async create(tenantId: string, organizerId: string, dto: CreateEventDto): Promise<Event> {
    const slug = slugify(dto.title, { lower: true, strict: true }) + '-' + Date.now();
    const event = this.eventsRepository.create({
      ...dto,
      tenantId,
      organizerId,
      slug,
    });
    return this.eventsRepository.save(event);
  }

  async findAll(tenantId: string | null, query: {
    page?: number;
    limit?: number;
    category?: EventCategory;
    status?: EventStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    isFree?: boolean;
    isFeatured?: boolean;
  }) {
    const { page = 1, limit = 20, category, status, search, startDate, endDate, isFree, isFeatured } = query;

    const qb = this.eventsRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.venue', 'venue');

    if (tenantId) qb.andWhere('event.tenantId = :tenantId', { tenantId });
    if (category) qb.andWhere('event.category = :category', { category });
    if (status) {
      qb.andWhere('event.status = :status', { status });
    } else {
      qb.andWhere('event.status = :status', { status: EventStatus.PUBLISHED });
    }
    if (search) {
      qb.andWhere('(event.title ILIKE :search OR event.description ILIKE :search)', { search: `%${search}%` });
    }
    if (startDate) qb.andWhere('event.startDate >= :startDate', { startDate });
    if (endDate) qb.andWhere('event.endDate <= :endDate', { endDate });
    if (isFree !== undefined) qb.andWhere('event.isFree = :isFree', { isFree });
    if (isFeatured) qb.andWhere('event.isFeatured = :isFeatured', { isFeatured });

    const [events, total] = await qb
      .orderBy('event.startDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByOrganizer(organizerId: string, page = 1, limit = 20) {
    const [events, total] = await this.eventsRepository.findAndCount({
      where: { organizerId },
      relations: ['venue'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['organizer', 'venue', 'tickets'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { slug },
      relations: ['organizer', 'venue', 'tickets'],
    });
    if (!event) throw new NotFoundException('Event not found');

    // Increment view count
    await this.eventsRepository.increment({ id: event.id }, 'viewCount', 1);
    return event;
  }

  async update(id: string, userId: string, userRole: UserRole, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findById(id);
    if (event.organizerId !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only update your own events');
    }

    Object.assign(event, dto);
    if (dto.title) {
      event.slug = slugify(dto.title, { lower: true, strict: true }) + '-' + Date.now();
    }
    return this.eventsRepository.save(event);
  }

  async publish(id: string, userId: string): Promise<Event> {
    const event = await this.findById(id);
    if (event.organizerId !== userId) {
      throw new ForbiddenException('You can only publish your own events');
    }
    event.status = EventStatus.PUBLISHED;
    event.publishedAt = new Date();
    return this.eventsRepository.save(event);
  }

  async cancel(id: string, userId: string, userRole: UserRole): Promise<Event> {
    const event = await this.findById(id);
    if (event.organizerId !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }
    event.status = EventStatus.CANCELLED;
    return this.eventsRepository.save(event);
  }

  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const event = await this.findById(id);
    if (event.organizerId !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }
    await this.eventsRepository.remove(event);
  }

  async getStats() {
    const total = await this.eventsRepository.count();
    const published = await this.eventsRepository.count({ where: { status: EventStatus.PUBLISHED } });
    const draft = await this.eventsRepository.count({ where: { status: EventStatus.DRAFT } });
    const cancelled = await this.eventsRepository.count({ where: { status: EventStatus.CANCELLED } });
    const completed = await this.eventsRepository.count({ where: { status: EventStatus.COMPLETED } });

    return { total, published, draft, cancelled, completed };
  }

  async getFeatured(limit = 6): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { isFeatured: true, status: EventStatus.PUBLISHED },
      relations: ['organizer', 'venue'],
      order: { startDate: 'ASC' },
      take: limit,
    });
  }
}
