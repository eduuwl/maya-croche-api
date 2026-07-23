import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ShippingQuoteRequestDto } from './dto/shipping-quote-request.dto';
import { ShippingQuoteResponseDto } from './dto/shipping-quote-response.dto';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(
    @Body() dto: ShippingQuoteRequestDto,
  ): Promise<ShippingQuoteResponseDto> {
    return this.shippingService.quote(dto);
  }
}
