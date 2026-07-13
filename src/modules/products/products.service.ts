import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  mapSizeFromContract,
  mapSizeToContract,
} from '../../common/mappers/product-size.mapper';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productInclude = {
  category: true,
  collection: true,
  images: { orderBy: { order: 'asc' } },
  sizes: true,
  colors: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

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

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const categoryId = await this.resolveCategoryId(dto.categorySlug);
    const collectionId = dto.collectionSlug
      ? await this.resolveCollectionId(dto.collectionSlug)
      : null;

    try {
      const product = await this.prisma.product.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          featured: dto.featured ?? false,
          bestSeller: dto.bestSeller ?? false,
          categoryId,
          collectionId,
          images: {
            create: dto.images.map((url, index) => ({ url, order: index })),
          },
          sizes: {
            create: dto.sizes.map((size) => ({
              size: mapSizeFromContract(size),
            })),
          },
          colors: { create: (dto.colors ?? []).map((color) => ({ color })) },
        },
        include: productInclude,
      });

      return this.toResponseDto(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe um produto com o slug "${dto.slug}"`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    await this.findByIdOrThrow(id);

    const categoryId = dto.categorySlug
      ? await this.resolveCategoryId(dto.categorySlug)
      : undefined;
    const collectionId =
      dto.collectionSlug !== undefined
        ? dto.collectionSlug
          ? await this.resolveCollectionId(dto.collectionSlug)
          : null
        : undefined;

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        if (dto.images) {
          await tx.productImage.deleteMany({ where: { productId: id } });
        }
        if (dto.sizes) {
          await tx.productSizeItem.deleteMany({ where: { productId: id } });
        }
        if (dto.colors) {
          await tx.productColor.deleteMany({ where: { productId: id } });
        }

        return tx.product.update({
          where: { id },
          data: {
            slug: dto.slug,
            name: dto.name,
            description: dto.description,
            price: dto.price,
            featured: dto.featured,
            bestSeller: dto.bestSeller,
            categoryId,
            collectionId,
            ...(dto.images && {
              images: {
                create: dto.images.map((url, index) => ({ url, order: index })),
              },
            }),
            ...(dto.sizes && {
              sizes: {
                create: dto.sizes.map((size) => ({
                  size: mapSizeFromContract(size),
                })),
              },
            }),
            ...(dto.colors && {
              colors: { create: dto.colors.map((color) => ({ color })) },
            }),
          },
          include: productInclude,
        });
      });

      return this.toResponseDto(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Já existe um produto com o slug "${dto.slug}"`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.product.delete({ where: { id } });
  }

  private async findByIdOrThrow(id: string): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Produto "${id}" não encontrado`);
    }
    return product;
  }

  private async resolveCategoryId(categorySlug: string): Promise<string> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (!category) {
      throw new NotFoundException(`Categoria "${categorySlug}" não encontrada`);
    }
    return category.id;
  }

  private async resolveCollectionId(collectionSlug: string): Promise<string> {
    const collection = await this.prisma.collection.findUnique({
      where: { slug: collectionSlug },
    });
    if (!collection) {
      throw new NotFoundException(`Coleção "${collectionSlug}" não encontrada`);
    }
    return collection.id;
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
