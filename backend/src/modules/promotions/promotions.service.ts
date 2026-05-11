import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Promotion, DiscountType } from './entities/promotion.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
  ) {}

  async create(tenantId: string, organizerId: string, data: Partial<Promotion>): Promise<Promotion> {
    const promo = this.promotionsRepository.create({ ...data, tenantId, organizerId });
    return this.promotionsRepository.save(promo);
  }

  async findByCode(code: string): Promise<Promotion> {
    const promo = await this.promotionsRepository.findOne({ where: { code: code.toUpperCase() } });
    if (!promo) throw new NotFoundException('Promo code not found');
    return promo;
  }

  async validateAndApply(code: string, orderAmount: number): Promise<{ discount: number; promotion: Promotion }> {
    const promo = await this.findByCode(code);
    const now = new Date();

    if (!promo.isActive) throw new BadRequestException('Promo code is inactive');
    if (now < promo.startDate || now > promo.endDate) throw new BadRequestException('Promo code expired');
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) throw new BadRequestException('Promo code usage limit reached');
    if (orderAmount < Number(promo.minOrderAmount)) throw new BadRequestException(`Minimum order amount is ${promo.minOrderAmount}`);

    let discount = 0;
    if (promo.discountType === DiscountType.PERCENTAGE) {
      discount = orderAmount * (Number(promo.discountValue) / 100);
      if (promo.maxDiscount && discount > Number(promo.maxDiscount)) {
        discount = Number(promo.maxDiscount);
      }
    } else {
      discount = Number(promo.discountValue);
    }

    return { discount, promotion: promo };
  }

  async incrementUsage(id: string): Promise<void> {
    await this.promotionsRepository.increment({ id }, 'usedCount', 1);
  }

  async findByOrganizer(organizerId: string) {
    return this.promotionsRepository.find({
      where: { organizerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(page = 1, limit = 20, tenantId?: string) {
    const qb = this.promotionsRepository.createQueryBuilder('promo');
    if (tenantId) qb.andWhere('promo.tenantId = :tenantId', { tenantId });
    
    const [promotions, total] = await qb
      .orderBy('promo.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { promotions, total, page, limit };
  }

  async delete(id: string): Promise<void> {
    await this.promotionsRepository.delete(id);
  }
}
