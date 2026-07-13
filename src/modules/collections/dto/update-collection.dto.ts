import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífen',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  image?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
