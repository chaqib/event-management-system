import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean,
  IsDateString, IsNumber, IsArray, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Conference 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A premier technology conference...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Annual tech conference featuring top speakers', required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({ enum: EventCategory, default: EventCategory.OTHER })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiProperty({ example: ['tech', 'conference'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: '2026-06-15T09:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-06-15T18:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ default: 'UTC', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  onlineUrl?: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @ApiProperty({ default: 'USD', required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}
