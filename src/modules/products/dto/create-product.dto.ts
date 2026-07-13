import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

const PRODUCT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único'];

export class CreateProductDto {
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífen',
  })
  slug: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(1)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;

  @IsString()
  categorySlug: string;

  @IsOptional()
  @IsString()
  collectionSlug?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  images: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(PRODUCT_SIZES, { each: true })
  sizes: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  bestSeller?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];
}
