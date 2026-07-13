import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SiteConfigResponseDto } from './dto/site-config-response.dto';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(): Promise<SiteConfigResponseDto> {
    const config = await this.prisma.siteConfig.findFirst({
      include: {
        aboutParagraphs: { orderBy: { order: 'asc' } },
        measureRows: { orderBy: { order: 'asc' } },
      },
    });

    if (!config) {
      throw new NotFoundException('Configuração do site não encontrada');
    }

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
