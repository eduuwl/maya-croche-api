import { Controller, Get } from '@nestjs/common';
import { Collection } from '@prisma/client';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll(): Promise<Collection[]> {
    return this.collectionsService.findAll();
  }
}
