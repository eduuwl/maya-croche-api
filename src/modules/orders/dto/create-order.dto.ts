import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(2)
  customerName: string;

  @IsString()
  @MinLength(8)
  customerPhone: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsString()
  @MinLength(1)
  addressStreet: string;

  @IsString()
  @MinLength(1)
  addressNumber: string;

  @IsOptional()
  @IsString()
  addressComplement?: string;

  @IsString()
  @MinLength(1)
  addressNeighborhood: string;

  @IsString()
  @MinLength(1)
  addressCity: string;

  @IsString()
  @MinLength(1)
  addressState: string;

  @IsString()
  @MinLength(1)
  addressZipCode: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
