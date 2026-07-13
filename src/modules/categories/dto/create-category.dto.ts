import { IsString, Matches, MinLength } from 'class-validator';

export class CreateCategoryDto {
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
}
