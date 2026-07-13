import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(5)
  description: string;
}
