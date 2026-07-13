import { ProductSize as PrismaProductSize } from '@prisma/client';

/**
 * O enum do Prisma não aceita acento ("Único"), então usamos "UNICO" no banco
 * e convertemos para o valor exato que o frontend espera no contrato de API.
 */
const SIZE_TO_CONTRACT: Record<PrismaProductSize, string> = {
  PP: 'PP',
  P: 'P',
  M: 'M',
  G: 'G',
  GG: 'GG',
  UNICO: 'Único',
};

const SIZE_FROM_CONTRACT: Record<string, PrismaProductSize> = {
  PP: 'PP',
  P: 'P',
  M: 'M',
  G: 'G',
  GG: 'GG',
  Único: 'UNICO',
};

export function mapSizeToContract(size: PrismaProductSize): string {
  return SIZE_TO_CONTRACT[size];
}

export function mapSizeFromContract(size: string): PrismaProductSize {
  const mapped = SIZE_FROM_CONTRACT[size];
  if (!mapped) {
    throw new Error(`Tamanho inválido: ${size}`);
  }
  return mapped;
}
