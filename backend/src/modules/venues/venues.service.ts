import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from './entities/venue.entity';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private readonly venuesRepository: Repository<Venue>,
  ) {}

  async create(data: Partial<Venue> & { tenantId?: string }): Promise<Venue> {
    const venue = this.venuesRepository.create(data);
    return this.venuesRepository.save(venue);
  }

  async findAll(page = 1, limit = 20, city?: string, tenantId?: string) {
    const qb = this.venuesRepository.createQueryBuilder('venue');
    if (tenantId) qb.andWhere('venue.tenantId = :tenantId', { tenantId });
    if (city) qb.andWhere('venue.city ILIKE :city', { city: `%${city}%` });

    const [venues, total] = await qb
      .orderBy('venue.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { venues, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Venue> {
    const venue = await this.venuesRepository.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async update(id: string, data: Partial<Venue>): Promise<Venue> {
    const venue = await this.findById(id);
    Object.assign(venue, data);
    return this.venuesRepository.save(venue);
  }

  async delete(id: string): Promise<void> {
    const venue = await this.findById(id);
    await this.venuesRepository.remove(venue);
  }
}
