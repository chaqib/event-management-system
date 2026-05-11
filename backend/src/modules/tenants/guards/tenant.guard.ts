import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../tenants.service';
import { TenantRole } from '../entities/tenant-user.entity';

export const TENANT_ROLES_KEY = 'tenant_roles';
export const TenantRoles = (...roles: TenantRole[]) =>
  (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(TENANT_ROLES_KEY, roles, descriptor?.value ?? target);
    return descriptor ?? target;
  };

/**
 * Guard that:
 * 1. Extracts tenantId from header (x-tenant-id) or query param
 * 2. Validates user is a member of that tenant
 * 3. Attaches tenantId and tenantRole to the request
 * 4. Optionally checks tenant-level roles via @TenantRoles()
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins bypass tenant checks
    if (user.role === 'super_admin' || user.role === 'admin') {
      const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
      if (tenantId) {
        request.tenantId = tenantId;
        request.tenantRole = TenantRole.OWNER; // Super admins get full access
      }
      return true;
    }

    const tenantId = request.headers['x-tenant-id'] || request.query.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (x-tenant-id header or tenantId query param)');
    }

    const tenantRole = await this.tenantsService.getUserTenantRole(tenantId, user.id);
    if (!tenantRole) {
      throw new ForbiddenException('You are not a member of this tenant');
    }

    request.tenantId = tenantId;
    request.tenantRole = tenantRole;

    // Check tenant-level roles if specified
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(TENANT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && !requiredRoles.includes(tenantRole)) {
      throw new ForbiddenException('Insufficient tenant role permissions');
    }

    return true;
  }
}
