import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { StripeService } from './stripe.service';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Payment } from './entities/payment.entity';
import { Invoice } from './entities/invoice.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice, Tenant, User]),
    ConfigModule,
    BookingsModule,
    UsersModule,
    forwardRef(() => TenantsModule),
  ],
  controllers: [PaymentsController, WebhooksController, InvoicesController],
  providers: [PaymentsService, StripeService, InvoicesService],
  exports: [PaymentsService, StripeService, InvoicesService],
})
export class PaymentsModule {}
