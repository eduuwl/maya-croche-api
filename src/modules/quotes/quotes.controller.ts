import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuoteRequest } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateQuoteDto): Promise<QuoteRequest> {
    return this.quotesService.create(dto);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('admin/quotes')
export class AdminQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  findAll(): Promise<QuoteRequest[]> {
    return this.quotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QuoteRequest> {
    return this.quotesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ): Promise<QuoteRequest> {
    return this.quotesService.update(id, dto);
  }
}
