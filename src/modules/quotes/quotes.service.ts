import { Injectable, NotFoundException } from '@nestjs/common';
import { QuoteRequest } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteRequest> {
    const quote = await this.prisma.quoteRequest.create({ data: dto });
    await this.mailService.notifyNewQuote(quote);
    return quote;
  }

  findAll(): Promise<QuoteRequest[]> {
    return this.prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<QuoteRequest> {
    const quote = await this.prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) {
      throw new NotFoundException(`Orçamento "${id}" não encontrado`);
    }
    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<QuoteRequest> {
    await this.findById(id);
    return this.prisma.quoteRequest.update({ where: { id }, data: dto });
  }
}
