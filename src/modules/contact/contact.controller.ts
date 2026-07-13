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
import { ContactMessage } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateContactDto): Promise<ContactMessage> {
    return this.contactService.create(dto);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('admin/contact')
export class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  findAll(): Promise<ContactMessage[]> {
    return this.contactService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ContactMessage> {
    return this.contactService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactMessage> {
    return this.contactService.update(id, dto);
  }
}
