import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  ticketId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  promoCodeId?: string;
}
