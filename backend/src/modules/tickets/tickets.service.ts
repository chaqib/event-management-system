import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async create(dto: CreateTicketDto & { tenantId?: string }): Promise<Ticket> {
    const ticket = this.ticketsRepository.create(dto);
    return this.ticketsRepository.save(ticket);
  }

  async findByEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { eventId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findById(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const ticket = await this.findById(id);
    Object.assign(ticket, data);
    return this.ticketsRepository.save(ticket);
  }

  async reserveTickets(ticketId: string, quantity: number): Promise<Ticket> {
    const ticket = await this.findById(ticketId);
    const available = ticket.quantityTotal - ticket.quantitySold - ticket.quantityReserved;
    if (quantity > available) {
      throw new BadRequestException(`Only ${available} tickets available`);
    }
    ticket.quantityReserved += quantity;
    return this.ticketsRepository.save(ticket);
  }

  async confirmSale(ticketId: string, quantity: number): Promise<void> {
    await this.ticketsRepository.increment({ id: ticketId }, 'quantitySold', quantity);
    await this.ticketsRepository.decrement({ id: ticketId }, 'quantityReserved', quantity);
  }

  async releaseReservation(ticketId: string, quantity: number): Promise<void> {
    await this.ticketsRepository.decrement({ id: ticketId }, 'quantityReserved', quantity);
  }

  async delete(id: string): Promise<void> {
    const ticket = await this.findById(id);
    if (ticket.quantitySold > 0) {
      throw new BadRequestException('Cannot delete ticket with sales');
    }
    await this.ticketsRepository.remove(ticket);
  }
}
