import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Collection, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Collection[]> {
    return this.prisma.collection.findMany({ orderBy: { name: 'asc' } });
  }

  async findByIdOrThrow(id: string): Promise<Collection> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException(`Coleção "${id}" não encontrada`);
    }
    return collection;
  }

  async create(dto: CreateCollectionDto): Promise<Collection> {
    try {
      return await this.prisma.collection.create({
        data: { ...dto, featured: dto.featured ?? false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe uma coleção com o slug "${dto.slug}"`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCollectionDto): Promise<Collection> {
    await this.findByIdOrThrow(id);

    try {
      return await this.prisma.collection.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe uma coleção com o slug "${dto.slug}"`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findByIdOrThrow(id);

    try {
      await this.prisma.collection.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Não é possível excluir uma coleção com produtos vinculados',
        );
      }
      throw error;
    }
  }
}
