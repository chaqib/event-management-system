import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  async create(tenantId: string, userId: string, eventId: string, data: { rating: number; title?: string; comment?: string }): Promise<Review> {
    const existing = await this.reviewsRepository.findOne({ where: { eventId, userId } });
    if (existing) throw new ConflictException('You have already reviewed this event');

    const review = this.reviewsRepository.create({ tenantId, userId, eventId, ...data });
    return this.reviewsRepository.save(review);
  }

  async findByEvent(eventId: string, page = 1, limit = 20) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { eventId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const avgRating = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.eventId = :eventId', { eventId })
      .getRawOne();

    return { reviews, total, averageRating: Number(avgRating.avg) || 0, page, limit };
  }

  async delete(id: string): Promise<void> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewsRepository.remove(review);
  }
}
