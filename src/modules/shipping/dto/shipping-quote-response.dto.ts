export interface ShippingQuoteResponseDto {
  carrier: string;
  price: number;
  estimatedDays?: number;
}
