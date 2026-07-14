import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ShippingService } from '../shipping/shipping.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

const orderInclude = {
  items: true,
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingService: ShippingService,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const missingIds = productIds.filter((id) => !productsById.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Produto(s) inválido(s): ${missingIds.join(', ')}`,
      );
    }

    const items = dto.items.map((item) => {
      const product = productsById.get(item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.price,
        size: item.size ?? null,
        color: item.color ?? null,
        quantity: item.quantity,
      };
    });

    const subtotalPrice = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const shipping = await this.shippingService.calculateShipping(
      dto.addressZipCode,
      dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );

    const totalPrice = Number(
      (subtotalPrice + shipping.price).toFixed(2),
    );

    const order = await this.prisma.order.create({
      data: {
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        addressStreet: dto.addressStreet,
        addressNumber: dto.addressNumber,
        addressComplement: dto.addressComplement,
        addressNeighborhood: dto.addressNeighborhood,
        addressCity: dto.addressCity,
        addressState: dto.addressState,
        addressZipCode: this.shippingService.normalizeCep(dto.addressZipCode),
        notes: dto.notes,
        subtotalPrice,
        shippingPrice: shipping.price,
        shippingCarrier: shipping.carrier,
        shippingEstimatedDays: shipping.estimatedDays,
        totalPrice,
        items: { create: items },
      },
      include: orderInclude,
    });

    return this.toResponseDto(order);
  }

  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.toResponseDto(order));
  }

  async findById(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException(`Pedido "${id}" não encontrado`);
    }
    return this.toResponseDto(order);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderResponseDto> {
    await this.findById(id);

    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes },
      include: orderInclude,
    });

    return this.toResponseDto(order);
  }

  private toResponseDto(order: OrderWithRelations): OrderResponseDto {
    return {
      id: order.id,
      code: `MC-${order.orderNumber.toString().padStart(6, '0')}`,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      address: {
        street: order.addressStreet,
        number: order.addressNumber,
        complement: order.addressComplement,
        neighborhood: order.addressNeighborhood,
        city: order.addressCity,
        state: order.addressState,
        zipCode: order.addressZipCode,
      },
      notes: order.notes,
      subtotalPrice: order.subtotalPrice,
      shippingPrice: order.shippingPrice,
      shippingCarrier: order.shippingCarrier,
      shippingEstimatedDays: order.shippingEstimatedDays ?? undefined,
      totalPrice: order.totalPrice,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        unitPrice: item.unitPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
