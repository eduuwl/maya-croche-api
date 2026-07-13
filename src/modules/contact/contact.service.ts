import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessage } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactDto): Promise<ContactMessage> {
    return this.prisma.contactMessage.create({ data: dto });
  }

  findAll(): Promise<ContactMessage[]> {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<ContactMessage> {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!message) {
      throw new NotFoundException(`Mensagem de contato "${id}" não encontrada`);
    }
    return message;
  }

  async update(id: string, dto: UpdateContactDto): Promise<ContactMessage> {
    await this.findById(id);
    return this.prisma.contactMessage.update({ where: { id }, data: dto });
  }
}
