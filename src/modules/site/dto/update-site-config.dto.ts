import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class HeroDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  ctaHref?: string;
}

class AboutDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paragraphs?: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  artisanName?: string;
}

class ContactDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;
}

class MeasureRowInputDto {
  @IsString()
  size: string;

  @IsString()
  bust: string;

  @IsString()
  waist: string;

  @IsString()
  hip: string;
}

class MeasuresDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  intro?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasureRowInputDto)
  rows?: MeasureRowInputDto[];
}

export class UpdateSiteConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  tagline?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HeroDto)
  hero?: HeroDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AboutDto)
  about?: AboutDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MeasuresDto)
  measures?: MeasuresDto;
}
