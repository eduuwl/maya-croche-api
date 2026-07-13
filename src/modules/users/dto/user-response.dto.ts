import { UserRole } from '@prisma/client';

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
