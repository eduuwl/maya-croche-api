import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DEFAULT_PACKAGE_PER_UNIT } from './constants/package-defaults';
import { ShippingQuoteRequestDto } from './dto/shipping-quote-request.dto';
import { ShippingQuoteResponseDto } from './dto/shipping-quote-response.dto';
import { SuperFreteService } from './superfrete.service';
import { SuperFreteProductInput } from './types/superfrete.types';

export interface ShippingItemInput {
  productId: string;
  quantity: number;
}

export interface ShippingCalculation {
  carrier: string;
  price: number;
  estimatedDays: number;
}

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly superFrete: SuperFreteService,
  ) {}

  async quote(dto: ShippingQuoteRequestDto): Promise<ShippingQuoteResponseDto> {
    const items = this.resolveQuoteItems(dto);
    const calculation = await this.calculateShipping(dto.cep, items);

    return {
      carrier: calculation.carrier,
      price: calculation.price,
      estimatedDays: calculation.estimatedDays,
    };
  }

  async calculateShipping(
    destinationCep: string,
    items: ShippingItemInput[],
  ): Promise<ShippingCalculation> {
    const normalizedCep = this.normalizeCep(destinationCep);
    const originCep = this.getOriginZip();
    const products = await this.loadProducts(items);
    const superFreteProducts = this.buildSuperFreteProducts(items);
    const insuranceValue = this.calculateInsuranceValue(products, items);

    const options = await this.superFrete.calculateQuote({
      from: { postal_code: originCep },
      to: { postal_code: normalizedCep },
      services: process.env.SUPERFRETE_SERVICES ?? '1,2,17',
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: insuranceValue,
        use_insurance_value: insuranceValue > 0,
      },
      products: superFreteProducts,
    });

    const bestOption = options
      .filter((option) => !option.has_error && option.price > 0)
      .sort((a, b) => a.price - b.price)[0];

    if (!bestOption) {
      const errorMessage = options.find((option) => option.error)?.error;
      throw new UnprocessableEntityException(
        errorMessage ??
          'Nenhuma opção de frete disponível para este CEP.',
      );
    }

    const carrierName = this.formatCarrierName(bestOption);

    return {
      carrier: carrierName,
      price: Number(bestOption.price.toFixed(2)),
      estimatedDays:
        bestOption.delivery_range?.max ?? bestOption.delivery_time,
    };
  }

  private resolveQuoteItems(
    dto: ShippingQuoteRequestDto,
  ): ShippingItemInput[] {
    const hasProductId = Boolean(dto.productId);
    const hasItems = Boolean(dto.items?.length);

    if (hasProductId === hasItems) {
      throw new BadRequestException(
        'Informe productId + cep (v1) ou cep + items (v2).',
      );
    }

    if (hasProductId) {
      return [{ productId: dto.productId!, quantity: 1 }];
    }

    return dto.items!;
  }

  private async loadProducts(
    items: ShippingItemInput[],
  ): Promise<Map<string, Product>> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const missingId = productIds.find((id) => !productsById.has(id));

    if (missingId) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return productsById;
  }

  private buildSuperFreteProducts(
    items: ShippingItemInput[],
  ): SuperFreteProductInput[] {
    return items.map((item) => ({
      quantity: item.quantity,
      weight: DEFAULT_PACKAGE_PER_UNIT.weight,
      height: DEFAULT_PACKAGE_PER_UNIT.height,
      width: DEFAULT_PACKAGE_PER_UNIT.width,
      length: DEFAULT_PACKAGE_PER_UNIT.length,
    }));
  }

  private calculateInsuranceValue(
    productsById: Map<string, Product>,
    items: ShippingItemInput[],
  ): number {
    return items.reduce((sum, item) => {
      const product = productsById.get(item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);
  }

  private getOriginZip(): string {
    const originZip = process.env.SHIPPING_ORIGIN_ZIP;
    if (!originZip) {
      throw new BadRequestException(
        'CEP de origem não configurado (SHIPPING_ORIGIN_ZIP).',
      );
    }

    return this.normalizeCep(originZip);
  }

  normalizeCep(cep: string): string {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new BadRequestException(
        'CEP inválido. Informe os 8 dígitos.',
      );
    }

    return digits;
  }

  private formatCarrierName(option: {
    name: string;
    company: { name: string };
  }): string {
    const company = option.company.name.trim();
    const service = option.name.trim();

    if (company.toLowerCase() === service.toLowerCase()) {
      return service;
    }

    return `${company} ${service}`;
  }
}
