import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class ShippingQuoteItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ShippingQuoteRequestDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  @Matches(/^\d{8}$/, { message: 'CEP inválido. Informe os 8 dígitos.' })
  cep: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingQuoteItemDto)
  items?: ShippingQuoteItemDto[];
}
