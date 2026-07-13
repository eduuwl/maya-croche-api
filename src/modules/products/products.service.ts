import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { mapSizeToContract } from '../../common/mappers/product-size.mapper';
import { ProductResponseDto } from './dto/product-response.dto';

const productInclude = {
  category: true,
  collection: true,
  images: { orderBy: { order: 'asc' } },
  sizes: true,
  colors: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.toResponseDto(product));
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Produto "${slug}" não encontrado`);
    }

    return this.toResponseDto(product);
  }

  private toResponseDto(product: ProductWithRelations): ProductResponseDto {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      categorySlug: product.category.slug,
      collectionSlug: product.collection?.slug ?? null,
      images: product.images.map((image) => image.url),
      sizes: product.sizes.map((item) => mapSizeToContract(item.size)),
      featured: product.featured,
      bestSeller: product.bestSeller,
      ...(product.colors.length > 0 && {
        colors: product.colors.map((color) => color.color),
      }),
    };
  }
}
