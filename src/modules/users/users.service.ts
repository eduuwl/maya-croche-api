import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return users.map((user) => this.toResponseDto(user));
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário "${id}" não encontrado`);
    }
    return this.toResponseDto(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: { name: dto.name, email: dto.email, passwordHash },
      });
      return this.toResponseDto(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com esse email');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findById(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.password !== undefined)
      data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.update({ where: { id }, data });
      return this.toResponseDto(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com esse email');
      }
      throw error;
    }
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    await this.findById(id);

    if (id === currentUserId) {
      throw new ForbiddenException('Você não pode excluir o próprio usuário');
    }

    const adminCount = await this.prisma.user.count();
    if (adminCount <= 1) {
      throw new ForbiddenException(
        'Não é possível excluir o último usuário administrador',
      );
    }

    await this.prisma.user.delete({ where: { id } });
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
