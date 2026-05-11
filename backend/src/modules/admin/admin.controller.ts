import { Controller, Get, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { UpdateTenantStatusDto, UpdateTenantPlanDto, BanUserDto, PaginationDto } from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform dashboard metrics' })
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  // Tenants
  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants' })
  async getAllTenants(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllTenants(page, limit, status as any);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details' })
  async getTenantDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getTenantDetails(id);
  }

  @Put('tenants/:id/status')
  @ApiOperation({ summary: 'Update tenant status (suspend/activate)' })
  async updateTenantStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.adminService.updateTenantStatus(id, dto);
  }

  @Put('tenants/:id/plan')
  @ApiOperation({ summary: 'Update tenant subscription plan' })
  async updateTenantPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantPlanDto,
  ) {
    return this.adminService.updateTenantPlan(id, dto);
  }

  // Users
  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
  ) {
    return this.adminService.getAllUsers(page, limit, role);
  }

  @Put('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(id, dto);
  }

  @Put('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unbanUser(id);
  }

  // Revenue & Analytics
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenue(@Query('days') days = 30) {
    return this.adminService.getRevenueAnalytics(days);
  }

  // Audit Logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getAuditLogs(page, limit);
  }
}
