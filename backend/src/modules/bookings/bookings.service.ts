import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingStatus } from './entities/booking.entity';
import { TicketsService } from '../tickets/tickets.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly ticketsService: TicketsService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateBookingDto): Promise<Booking> {
    const ticket = await this.ticketsService.findById(dto.ticketId);

    // Check availability and reserve
    await this.ticketsService.reserveTickets(dto.ticketId, dto.quantity);

    const subtotal = Number(ticket.price) * dto.quantity;
    const serviceFee = subtotal * 0.05; // 5% service fee
    const totalAmount = subtotal + serviceFee - (dto.discountAmount || 0);

    const bookingNumber = 'BK-' + Date.now().toString(36).toUpperCase() + '-' + uuidv4().substring(0, 4).toUpperCase();

    const booking = this.bookingsRepository.create({
      bookingNumber,
      tenantId,
      eventId: ticket.eventId,
      userId,
      ticketId: dto.ticketId,
      quantity: dto.quantity,
      unitPrice: ticket.price,
      subtotal,
      serviceFee,
      discountAmount: dto.discountAmount || 0,
      totalAmount,
      currency: ticket.currency,
      qrCode: uuidv4(),
    });

    return this.bookingsRepository.save(booking);
  }

  async findAll(query: { page?: number; limit?: number; status?: BookingStatus; eventId?: string; tenantId?: string }) {
    const { page = 1, limit = 20, status, eventId, tenantId } = query;
    const qb = this.bookingsRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.ticket', 'ticket');

    if (tenantId) qb.andWhere('booking.tenantId = :tenantId', { tenantId });
    if (status) qb.andWhere('booking.status = :status', { status });
    if (eventId) qb.andWhere('booking.eventId = :eventId', { eventId });

    const [bookings, total] = await qb
      .orderBy('booking.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [bookings, total] = await this.bookingsRepository.findAndCount({
      where: { userId },
      relations: ['event', 'ticket'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['event', 'user', 'ticket'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async findByBookingNumber(bookingNumber: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { bookingNumber },
      relations: ['event', 'user', 'ticket'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async confirm(id: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in pending status');
    }
    booking.status = BookingStatus.CONFIRMED;
    await this.ticketsService.confirmSale(booking.ticketId, booking.quantity);
    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string, userId: string, reason?: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (booking.userId !== userId) {
      throw new BadRequestException('You can only cancel your own bookings');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    const previousStatus = booking.status;
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'Cancelled by user';

    // Release tickets
    if (previousStatus === BookingStatus.PENDING) {
      await this.ticketsService.releaseReservation(booking.ticketId, booking.quantity);
    }

    return this.bookingsRepository.save(booking);
  }

  async checkIn(id: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be confirmed for check-in');
    }
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    return this.bookingsRepository.save(booking);
  }

  async getStats() {
    const total = await this.bookingsRepository.count();
    const confirmed = await this.bookingsRepository.count({ where: { status: BookingStatus.CONFIRMED } });
    const cancelled = await this.bookingsRepository.count({ where: { status: BookingStatus.CANCELLED } });
    const revenue = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('COALESCE(SUM(booking.totalAmount), 0)', 'total')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .getRawOne();

    return { total, confirmed, cancelled, totalRevenue: Number(revenue.total) };
  }
}
