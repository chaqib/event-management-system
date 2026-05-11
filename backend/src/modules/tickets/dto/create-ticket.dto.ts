import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber,
  IsDateString, IsArray, Min, IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketType } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty()
  @IsUUID()
  eventId: string;

  @ApiProperty({ example: 'VIP Pass' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TicketType, default: TicketType.REGULAR })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  quantityTotal: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
}
