import { ContactStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateContactDto {
  @IsEnum(ContactStatus)
  status: ContactStatus;
}
