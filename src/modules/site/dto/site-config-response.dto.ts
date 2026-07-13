export interface MeasureRowDto {
  size: string;
  bust: string;
  waist: string;
  hip: string;
}

export interface SiteConfigResponseDto {
  name: string;
  tagline: string;
  hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  };
  about: {
    title: string;
    paragraphs: string[];
    artisanName: string;
  };
  contact: {
    whatsapp: string;
    email: string;
    city: string;
  };
  measures: {
    intro: string;
    rows: MeasureRowDto[];
  };
}
