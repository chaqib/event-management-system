import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request, ParseUUIDPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { Promotion } from './entities/promotion.entity';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a promo code' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async create(@Request() req: any, @Body() data: Partial<Promotion>, @Headers('x-tenant-id') tenantId: string) {
    return this.promotionsService.create(tenantId, req.user.id, data);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a promo code' })
  async validate(@Body() body: { code: string; orderAmount: number }) {
    return this.promotionsService.validateAndApply(body.code, body.orderAmount);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all promotions (Admin)' })
  async findAll(@Query('page') page = 1, @Query('tenantId') tenantId?: string) {
    return this.promotionsService.findAll(page, 20, tenantId);
  }

  @Get('my-promos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my promotions (Organizer)' })
  async getMyPromos(@Request() req: any) {
    return this.promotionsService.findByOrganizer(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a promotion' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.delete(id);
  }
}
