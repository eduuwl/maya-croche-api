import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { SuperFreteService } from './superfrete.service';

@Module({
  controllers: [ShippingController],
  providers: [ShippingService, SuperFreteService],
  exports: [ShippingService],
})
export class ShippingModule {}
