import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Tenant, TenantStatus, SubscriptionPlan } from './entities/tenant.entity';
import { TenantUser, TenantRole } from './entities/tenant-user.entity';
import { UsersService } from '../users/users.service';
import { CreateTenantDto, UpdateTenantDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/tenant.dto';

const PLAN_LIMITS: Record<SubscriptionPlan, { maxEvents: number; maxAttendees: number; maxTeam: number; fee: number }> = {
  [SubscriptionPlan.FREE_TRIAL]: { maxEvents: 3, maxAttendees: 100, maxTeam: 2, fee: 5.00 },
  [SubscriptionPlan.STARTER]: { maxEvents: 10, maxAttendees: 500, maxTeam: 3, fee: 3.00 },
  [SubscriptionPlan.PRO]: { maxEvents: 50, maxAttendees: 5000, maxTeam: 10, fee: 2.00 },
  [SubscriptionPlan.ENTERPRISE]: { maxEvents: -1, maxAttendees: -1, maxTeam: -1, fee: 1.00 },
};

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUsersRepo: Repository<TenantUser>,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateTenantDto): Promise<{ tenant: Tenant; membership: TenantUser }> {
    const slug = slugify(dto.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    const limits = PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL];

    const tenant = this.tenantsRepo.create({
      ...dto,
      slug,
      ownerId,
      status: TenantStatus.TRIAL,
      subscriptionPlan: SubscriptionPlan.FREE_TRIAL,
      trialEndsAt,
      maxEvents: limits.maxEvents,
      maxAttendeesPerEvent: limits.maxAttendees,
      maxTeamMembers: limits.maxTeam,
      platformFeePercentage: limits.fee,
    });
    const savedTenant = await this.tenantsRepo.save(tenant);

    // Add owner as first member
    const membership = this.tenantUsersRepo.create({
      tenantId: savedTenant.id,
      userId: ownerId,
      tenantRole: TenantRole.OWNER,
      isActive: true,
      joinedAt: new Date(),
    });
    const savedMembership = await this.tenantUsersRepo.save(membership);

    return { tenant: savedTenant, membership: savedMembership };
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findOne({ where: { id }, relations: ['members', 'members.user'] });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findAll(page = 1, limit = 20) {
    const [tenants, total] = await this.tenantsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { tenants, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findUserTenants(userId: string): Promise<(TenantUser & { tenant: Tenant })[]> {
    return this.tenantUsersRepo.find({
      where: { userId, isActive: true },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    }) as any;
  }

  async update(tenantId: string, userId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    await this.requireRole(tenantId, userId, [TenantRole.OWNER, TenantRole.ADMIN]);

    if (dto.name) {
      tenant.slug = slugify(dto.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
    }
    Object.assign(tenant, dto);
    return this.tenantsRepo.save(tenant);
  }

  // --- Members ---
  async inviteMember(tenantId: string, invitedByUserId: string, dto: InviteMemberDto): Promise<TenantUser> {
    await this.requireRole(tenantId, invitedByUserId, [TenantRole.OWNER, TenantRole.ADMIN]);

    const tenant = await this.findById(tenantId);
    const activeMembers = await this.tenantUsersRepo.count({ where: { tenantId, isActive: true } });
    if (tenant.maxTeamMembers !== -1 && activeMembers >= tenant.maxTeamMembers) {
      throw new BadRequestException(`Team member limit (${tenant.maxTeamMembers}) reached. Upgrade your plan.`);
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found. They must register first.');

    const existing = await this.tenantUsersRepo.findOne({ where: { tenantId, userId: user.id } });
    if (existing) throw new ConflictException('User is already a member of this tenant');

    const role = dto.role as TenantRole;
    if (!Object.values(TenantRole).includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const membership = this.tenantUsersRepo.create({
      tenantId,
      userId: user.id,
      tenantRole: role,
      invitedBy: invitedByUserId,
      isActive: true,
      joinedAt: new Date(),
    });
    return this.tenantUsersRepo.save(membership);
  }

  async updateMemberRole(tenantId: string, memberId: string, actingUserId: string, dto: UpdateMemberRoleDto): Promise<TenantUser> {
    await this.requireRole(tenantId, actingUserId, [TenantRole.OWNER, TenantRole.ADMIN]);

    const member = await this.tenantUsersRepo.findOne({ where: { id: memberId, tenantId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.tenantRole === TenantRole.OWNER) throw new ForbiddenException('Cannot change owner role');

    const role = dto.role as TenantRole;
    if (!Object.values(TenantRole).includes(role) || role === TenantRole.OWNER) {
      throw new BadRequestException('Invalid role');
    }

    member.tenantRole = role;
    return this.tenantUsersRepo.save(member);
  }

  async removeMember(tenantId: string, memberId: string, actingUserId: string): Promise<void> {
    await this.requireRole(tenantId, actingUserId, [TenantRole.OWNER, TenantRole.ADMIN]);

    const member = await this.tenantUsersRepo.findOne({ where: { id: memberId, tenantId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.tenantRole === TenantRole.OWNER) throw new ForbiddenException('Cannot remove the owner');

    member.isActive = false;
    await this.tenantUsersRepo.save(member);
  }

  async getMembers(tenantId: string): Promise<TenantUser[]> {
    return this.tenantUsersRepo.find({
      where: { tenantId, isActive: true },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  // --- Subscription ---
  async updateSubscription(tenantId: string, userId: string, plan: SubscriptionPlan): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    await this.requireRole(tenantId, userId, [TenantRole.OWNER]);

    const limits = PLAN_LIMITS[plan];
    tenant.subscriptionPlan = plan;
    tenant.maxEvents = limits.maxEvents;
    tenant.maxAttendeesPerEvent = limits.maxAttendees;
    tenant.maxTeamMembers = limits.maxTeam;
    tenant.platformFeePercentage = limits.fee;
    tenant.status = TenantStatus.ACTIVE;
    tenant.subscriptionStartsAt = new Date();

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    tenant.subscriptionEndsAt = endDate;

    return this.tenantsRepo.save(tenant);
  }

  // --- Helpers ---
  async getUserTenantRole(tenantId: string, userId: string): Promise<TenantRole | null> {
    const membership = await this.tenantUsersRepo.findOne({
      where: { tenantId, userId, isActive: true },
    });
    return membership?.tenantRole || null;
  }

  async requireRole(tenantId: string, userId: string, allowedRoles: TenantRole[]): Promise<TenantUser> {
    const membership = await this.tenantUsersRepo.findOne({
      where: { tenantId, userId, isActive: true },
    });
    if (!membership || !allowedRoles.includes(membership.tenantRole)) {
      throw new ForbiddenException('Insufficient tenant permissions');
    }
    return membership;
  }

  async getTenantStats() {
    const total = await this.tenantsRepo.count();
    const active = await this.tenantsRepo.count({ where: { status: TenantStatus.ACTIVE } });
    const trial = await this.tenantsRepo.count({ where: { status: TenantStatus.TRIAL } });
    const suspended = await this.tenantsRepo.count({ where: { status: TenantStatus.SUSPENDED } });

    return { total, active, trial, suspended };
  }
}
