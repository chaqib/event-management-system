import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus, SubscriptionPlan } from '../tenants/entities/tenant.entity';
import { TenantUser } from '../tenants/entities/tenant-user.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UpdateTenantStatusDto, UpdateTenantPlanDto, BanUserDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(TenantUser)
    private readonly tenantUsersRepo: Repository<TenantUser>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
  ) {}

  // Dashboard
  async getDashboardMetrics() {
    const totalTenants = await this.tenantsRepo.count();
    const activeTenants = await this.tenantsRepo.count({ where: { status: TenantStatus.ACTIVE } });
    const trialTenants = await this.tenantsRepo.count({ where: { status: TenantStatus.TRIAL } });
    const suspendedTenants = await this.tenantsRepo.count({ where: { status: TenantStatus.SUSPENDED } });

    const totalUsers = await this.usersRepo.count();
    const activeUsers = await this.usersRepo.count({ where: { status: UserStatus.ACTIVE } });
    const bannedUsers = await this.usersRepo.count({ where: { status: UserStatus.SUSPENDED } });

    const totalRevenue = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where('p.status = :status', { status: 'completed' })
      .getRawOne();

    const recentPayments = await this.paymentsRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        suspended: suspendedTenants,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
      },
      revenue: {
        total: Number(totalRevenue?.total || 0),
        recentPayments: recentPayments.length,
      },
    };
  }

  // Tenant Management
  async getAllTenants(page = 1, limit = 20, status?: TenantStatus) {
    const where = status ? { status } : {};
    const [tenants, total] = await this.tenantsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch owner details for each tenant
    const tenantsWithOwners = await Promise.all(
      tenants.map(async (t) => {
        const owner = await this.usersRepo.findOne({ where: { id: t.ownerId } });
        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
          ownerEmail: owner?.email || 'Unknown',
          status: t.status,
          plan: t.subscriptionPlan,
          createdAt: t.createdAt,
          trialEndsAt: t.trialEndsAt,
          subscriptionEndsAt: t.subscriptionEndsAt,
          maxEvents: t.maxEvents,
          maxTeamMembers: t.maxTeamMembers,
        };
      }),
    );

    return {
      tenants: tenantsWithOwners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTenantDetails(id: string) {
    const tenant = await this.tenantsRepo.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const owner = await this.usersRepo.findOne({ where: { id: tenant.ownerId } });
    const memberCount = await this.tenantUsersRepo.count({ where: { tenantId: id, isActive: true } });
    const eventCount = await this.paymentsRepo.query(
      'SELECT COUNT(*) as count FROM events WHERE tenant_id = $1',
      [id],
    );

    return {
      ...tenant,
      ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
      ownerEmail: owner?.email || 'Unknown',
      memberCount,
      eventCount: eventCount[0]?.count || 0,
    };
  }

  async updateTenantStatus(id: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.tenantsRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    tenant.status = dto.status;
    return this.tenantsRepo.save(tenant);
  }

  async updateTenantPlan(id: string, dto: UpdateTenantPlanDto) {
    const tenant = await this.tenantsRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const PLAN_LIMITS: Record<SubscriptionPlan, any> = {
      [SubscriptionPlan.FREE_TRIAL]: { maxEvents: 3, maxAttendees: 100, maxTeam: 2, fee: 5.0 },
      [SubscriptionPlan.STARTER]: { maxEvents: 10, maxAttendees: 500, maxTeam: 3, fee: 3.0 },
      [SubscriptionPlan.PRO]: { maxEvents: 50, maxAttendees: 5000, maxTeam: 10, fee: 2.0 },
      [SubscriptionPlan.ENTERPRISE]: { maxEvents: -1, maxAttendees: -1, maxTeam: -1, fee: 1.0 },
    };

    const limits = PLAN_LIMITS[dto.plan];
    tenant.subscriptionPlan = dto.plan;
    tenant.maxEvents = limits.maxEvents;
    tenant.maxAttendeesPerEvent = limits.maxAttendees;
    tenant.maxTeamMembers = limits.maxTeam;
    tenant.platformFeePercentage = limits.fee;
    tenant.status = TenantStatus.ACTIVE;

    return this.tenantsRepo.save(tenant);
  }

  // User Management
  async getAllUsers(page = 1, limit = 20, role?: string) {
    const where: any = {};
    if (role) {
      where.role = role;
    }
    const [users, total] = await this.usersRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users: users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async banUser(id: string, dto: BanUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('User is already banned');
    }

    user.status = UserStatus.SUSPENDED;
    return this.usersRepo.save(user);
  }

  async unbanUser(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.ACTIVE;
    return this.usersRepo.save(user);
  }

  // Revenue & Analytics
  async getRevenueAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('DATE(p.createdAt)', 'date')
      .addSelect('SUM(p.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('p.createdAt >= :startDate', { startDate })
      .where('p.status = :status', { status: 'completed' })
      .groupBy('DATE(p.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const byPlan = await this.tenantsRepo
      .createQueryBuilder('t')
      .select('t.subscriptionPlan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.subscriptionPlan')
      .getRawMany();

    const totalRevenue = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where('p.status = :status', { status: 'completed' })
      .getRawOne();

    return {
      dailyRevenue: payments.map(p => ({
        date: p.date,
        amount: Number(p.total),
        transactions: Number(p.count),
      })),
      byPlan,
      totalRevenue: Number(totalRevenue?.total || 0),
    };
  }

  // Audit Logs (placeholder - would need actual audit log entity)
  async getAuditLogs(page = 1, limit = 20) {
    return {
      logs: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}
