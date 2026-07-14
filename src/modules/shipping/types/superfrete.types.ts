export interface SuperFreteProductInput {
  quantity: number;
  weight: number;
  height: number;
  width: number;
  length: number;
}

export interface SuperFreteCalculatorRequest {
  from: { postal_code: string };
  to: { postal_code: string };
  services: string;
  options: {
    own_hand: boolean;
    receipt: boolean;
    insurance_value: number;
    use_insurance_value: boolean;
  };
  products: SuperFreteProductInput[];
}

export interface SuperFreteQuoteOption {
  id: number;
  name: string;
  price: number;
  delivery_time: number;
  delivery_range?: {
    min: number;
    max: number;
  };
  company: {
    id: number;
    name: string;
    picture?: string;
  };
  has_error: boolean;
  error?: string;
}
