import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getDashboardOverview() {
    const [userStats, eventStats, bookingStats, revenueStats] = await Promise.all([
      this.usersService.getDashboardStats(),
      this.eventsService.getStats(),
      this.bookingsService.getStats(),
      this.paymentsService.getRevenueStats(),
    ]);

    return {
      users: userStats,
      events: eventStats,
      bookings: bookingStats,
      revenue: revenueStats,
    };
  }
}
