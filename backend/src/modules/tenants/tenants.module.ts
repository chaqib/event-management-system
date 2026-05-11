import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Tenant } from './entities/tenant.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { SubscriptionsService } from './subscriptions.service';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantUser]),
    ConfigModule,
    forwardRef(() => UsersModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [TenantsController],
  providers: [TenantsService, SubscriptionsService],
  exports: [TenantsService, SubscriptionsService],
})
export class TenantsModule {}
