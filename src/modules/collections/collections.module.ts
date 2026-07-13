import { Module } from '@nestjs/common';
import {
  AdminCollectionsController,
  CollectionsController,
} from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  controllers: [CollectionsController, AdminCollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
