import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { TenantStatus } from '../../tenants/entities/tenant.entity';
import { SubscriptionPlan } from '../../tenants/entities/tenant.entity';

export class UpdateTenantStatusDto {
  @IsEnum(TenantStatus)
  status: TenantStatus;

  @IsOptional()
  reason?: string;
}

export class UpdateTenantPlanDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

export class BanUserDto {
  @IsOptional()
  reason?: string;
}

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 20;
}
