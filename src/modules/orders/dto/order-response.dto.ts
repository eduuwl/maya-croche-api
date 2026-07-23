import { OrderStatus } from '@prisma/client';

export interface OrderItemResponseDto {
  id: string;
  productId: string | null;
  productName: string;
  productSlug: string;
  unitPrice: number;
  size: string | null;
  color: string | null;
  quantity: number;
}

export interface OrderResponseDto {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes: string | null;
  subtotalPrice: number;
  shippingPrice: number;
  shippingCarrier: string | null;
  shippingEstimatedDays?: number;
  totalPrice: number;
  items: OrderItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
