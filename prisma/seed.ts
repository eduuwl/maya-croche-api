import { PrismaClient } from '@prisma/client';
import { mapSizeFromContract } from '../src/common/mappers/product-size.mapper';

import categoriesData from './seed-data/categories.json';
import collectionsData from './seed-data/collections.json';
import productsData from './seed-data/products.json';
import siteData from './seed-data/site.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando dados existentes...');
  await prisma.measureRow.deleteMany();
  await prisma.aboutParagraph.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productSizeItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();

  console.log('Seedando categorias...');
  for (const category of categoriesData) {
    await prisma.category.create({ data: category });
  }

  console.log('Seedando coleções...');
  for (const collection of collectionsData) {
    await prisma.collection.create({ data: collection });
  }

  console.log('Seedando produtos...');
  for (const product of productsData) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    });

    const collection = product.collectionSlug
      ? await prisma.collection.findUniqueOrThrow({
          where: { slug: product.collectionSlug },
        })
      : null;

    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
        featured: product.featured,
        bestSeller: product.bestSeller,
        categoryId: category.id,
        collectionId: collection?.id,
        images: {
          create: product.images.map((url, index) => ({ url, order: index })),
        },
        sizes: {
          create: product.sizes.map((size) => ({
            size: mapSizeFromContract(size),
          })),
        },
        colors: {
          create: (product.colors ?? []).map((color) => ({ color })),
        },
      },
    });
  }

  console.log('Seedando configuração do site...');
  await prisma.siteConfig.create({
    data: {
      name: siteData.name,
      tagline: siteData.tagline,
      heroTitle: siteData.hero.title,
      heroSubtitle: siteData.hero.subtitle,
      heroCtaLabel: siteData.hero.ctaLabel,
      heroCtaHref: siteData.hero.ctaHref,
      aboutTitle: siteData.about.title,
      artisanName: siteData.about.artisanName,
      contactWhatsapp: siteData.contact.whatsapp,
      contactEmail: siteData.contact.email,
      contactCity: siteData.contact.city,
      measuresIntro: siteData.measures.intro,
      aboutParagraphs: {
        create: siteData.about.paragraphs.map((text, index) => ({
          text,
          order: index,
        })),
      },
      measureRows: {
        create: siteData.measures.rows.map((row, index) => ({
          size: row.size,
          bust: row.bust,
          waist: row.waist,
          hip: row.hip,
          order: index,
        })),
      },
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
