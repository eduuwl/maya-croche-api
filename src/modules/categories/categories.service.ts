import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findByIdOrThrow(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoria "${id}" não encontrada`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe uma categoria com o slug "${dto.slug}"`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findByIdOrThrow(id);

    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe uma categoria com o slug "${dto.slug}"`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findByIdOrThrow(id);

    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Não é possível excluir uma categoria com produtos vinculados',
        );
      }
      throw error;
    }
  }
}
