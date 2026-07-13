import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SiteConfigResponseDto } from './dto/site-config-response.dto';
import { UpdateSiteConfigDto } from './dto/update-site-config.dto';

const siteConfigInclude = {
  aboutParagraphs: { orderBy: { order: 'asc' } },
  measureRows: { orderBy: { order: 'asc' } },
} satisfies Prisma.SiteConfigInclude;

type SiteConfigWithRelations = Prisma.SiteConfigGetPayload<{
  include: typeof siteConfigInclude;
}>;

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(): Promise<SiteConfigResponseDto> {
    const config = await this.findConfigOrThrow();
    return this.toResponseDto(config);
  }

  async updateConfig(dto: UpdateSiteConfigDto): Promise<SiteConfigResponseDto> {
    const existing = await this.findConfigOrThrow();

    const config = await this.prisma.$transaction(async (tx) => {
      if (dto.about?.paragraphs) {
        await tx.aboutParagraph.deleteMany({
          where: { siteConfigId: existing.id },
        });
      }
      if (dto.measures?.rows) {
        await tx.measureRow.deleteMany({
          where: { siteConfigId: existing.id },
        });
      }

      return tx.siteConfig.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          tagline: dto.tagline,
          heroTitle: dto.hero?.title,
          heroSubtitle: dto.hero?.subtitle,
          heroCtaLabel: dto.hero?.ctaLabel,
          heroCtaHref: dto.hero?.ctaHref,
          aboutTitle: dto.about?.title,
          artisanName: dto.about?.artisanName,
          contactWhatsapp: dto.contact?.whatsapp,
          contactEmail: dto.contact?.email,
          contactCity: dto.contact?.city,
          measuresIntro: dto.measures?.intro,
          ...(dto.about?.paragraphs && {
            aboutParagraphs: {
              create: dto.about.paragraphs.map((text, index) => ({
                text,
                order: index,
              })),
            },
          }),
          ...(dto.measures?.rows && {
            measureRows: {
              create: dto.measures.rows.map((row, index) => ({
                ...row,
                order: index,
              })),
            },
          }),
        },
        include: siteConfigInclude,
      });
    });

    return this.toResponseDto(config);
  }

  private async findConfigOrThrow(): Promise<SiteConfigWithRelations> {
    const config = await this.prisma.siteConfig.findFirst({
      include: siteConfigInclude,
    });
    if (!config) {
      throw new NotFoundException('Configuração do site não encontrada');
    }
    return config;
  }

  private toResponseDto(
    config: SiteConfigWithRelations,
  ): SiteConfigResponseDto {
    return {
      name: config.name,
      tagline: config.tagline,
      hero: {
        title: config.heroTitle,
        subtitle: config.heroSubtitle,
        ctaLabel: config.heroCtaLabel,
        ctaHref: config.heroCtaHref,
      },
      about: {
        title: config.aboutTitle,
        paragraphs: config.aboutParagraphs.map((p) => p.text),
        artisanName: config.artisanName,
      },
      contact: {
        whatsapp: config.contactWhatsapp,
        email: config.contactEmail,
        city: config.contactCity,
      },
      measures: {
        intro: config.measuresIntro,
        rows: config.measureRows.map((row) => ({
          size: row.size,
          bust: row.bust,
          waist: row.waist,
          hip: row.hip,
        })),
      },
    };
  }
}
