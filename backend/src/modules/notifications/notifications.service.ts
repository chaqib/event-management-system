import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(userId: string, type: NotificationType, title: string, message: string, data?: Record<string, any>): Promise<Notification> {
    const notification = this.notificationsRepository.create({ userId, type, title, message, data: data || {} });
    return this.notificationsRepository.save(notification);
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unreadCount = await this.notificationsRepository.count({ where: { userId, isRead: false } });
    return { notifications, total, unreadCount, page, limit };
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, { isRead: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }
}
