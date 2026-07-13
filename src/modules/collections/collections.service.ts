import { Injectable } from '@nestjs/common';
import { Collection } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Collection[]> {
    return this.prisma.collection.findMany({ orderBy: { name: 'asc' } });
  }
}
