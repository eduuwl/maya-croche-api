export interface ProductResponseDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  categorySlug: string;
  collectionSlug: string | null;
  images: string[];
  sizes: string[];
  featured: boolean;
  bestSeller: boolean;
  colors?: string[];
}
