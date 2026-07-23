import {
  BadGatewayException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  SuperFreteCalculatorRequest,
  SuperFreteQuoteOption,
} from './types/superfrete.types';

const DEFAULT_API_URL = 'https://sandbox.superfrete.com';
// Produção: https://api.superfrete.com
const DEFAULT_USER_AGENT =
  'Maya Croche API/1.0 (admin@mayacroche.com.br)';

@Injectable()
export class SuperFreteService {
  private readonly logger = new Logger(SuperFreteService.name);

  async calculateQuote(
    payload: SuperFreteCalculatorRequest,
  ): Promise<SuperFreteQuoteOption[]> {
    const token = process.env.SUPERFRETE_TOKEN?.trim();
    if (!token) {
      throw new BadGatewayException(
        'Integração de frete não configurada (SUPERFRETE_TOKEN ausente).',
      );
    }

    const baseUrl = (process.env.SUPERFRETE_API_URL ?? DEFAULT_API_URL).replace(
      /\/$/,
      '',
    );
    const userAgent = process.env.SUPERFRETE_USER_AGENT ?? DEFAULT_USER_AGENT;
    const authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/v0/calculator`, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'User-Agent': userAgent,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error('Falha ao conectar com SuperFrete', error);
      throw new BadGatewayException(
        'Não foi possível consultar o frete no momento. Tente novamente.',
      );
    }

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `SuperFrete retornou ${response.status} (${baseUrl}): ${body.slice(0, 500)}`,
      );

      if (response.status === 401) {
        throw new BadGatewayException(
          'Token SuperFrete inválido. Gere o token no mesmo ambiente da SUPERFRETE_API_URL (sandbox ou produção) e reinicie a API.',
        );
      }

      throw new BadGatewayException(
        'Não foi possível calcular o frete. Tente novamente.',
      );
    }

    const data = (await response.json()) as SuperFreteQuoteOption[];
    if (!Array.isArray(data) || data.length === 0) {
      throw new UnprocessableEntityException(
        'Nenhuma opção de frete disponível para este CEP.',
      );
    }

    return data;
  }
}
