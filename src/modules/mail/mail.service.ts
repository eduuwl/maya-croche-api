import { Injectable, Logger } from '@nestjs/common';
import { QuoteRequest } from '@prisma/client';
import { Resend } from 'resend';
import { OrderResponseDto } from '../orders/dto/order-response.dto';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Belem',
});

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly notifyTo: string | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    this.from =
      process.env.RESEND_FROM?.trim() || 'Maya Crochê <onboarding@resend.dev>';
    this.notifyTo = process.env.NOTIFY_EMAIL?.trim() || null;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async notifyNewQuote(quote: QuoteRequest): Promise<void> {
    const rows: Array<[string, string]> = [
      ['Nome', quote.name],
      ['Telefone', quote.phone],
      ['E-mail', quote.email ?? '—'],
      ['Recebido em', dateTime.format(quote.createdAt)],
    ];

    await this.send({
      subject: `Novo orçamento — ${quote.name}`,
      replyTo: quote.email ?? undefined,
      html: this.layout(
        'Novo pedido de orçamento',
        `<p style="margin:0 0 16px;">Alguém pediu um orçamento pelo site.</p>
         ${this.table(rows)}
         <p style="margin:20px 0 8px;font-weight:600;">Descrição</p>
         <p style="margin:0;white-space:pre-wrap;">${escapeHtml(quote.description)}</p>`,
      ),
    });
  }

  async notifyNewOrder(order: OrderResponseDto): Promise<void> {
    const address = [
      `${order.address.street}, ${order.address.number}`,
      order.address.complement,
      order.address.neighborhood,
      `${order.address.city} — ${order.address.state}`,
      `CEP ${order.address.zipCode}`,
    ]
      .filter(Boolean)
      .join('\n');

    const customerRows: Array<[string, string]> = [
      ['Cliente', order.customerName],
      ['Telefone', order.customerPhone],
      ['E-mail', order.customerEmail ?? '—'],
      ['Recebido em', dateTime.format(order.createdAt)],
    ];

    const itemRows = order.items
      .map((item) => {
        const details = [item.size, item.color].filter(Boolean).join(' · ');
        const label = details
          ? `${item.productName} (${details})`
          : item.productName;
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${currency.format(item.unitPrice)}</td>
        </tr>`;
      })
      .join('');

    const shippingDays = order.shippingEstimatedDays
      ? ` · até ${order.shippingEstimatedDays} dia(s)`
      : '';

    await this.send({
      subject: `Novo pedido ${order.code} — ${order.customerName}`,
      replyTo: order.customerEmail ?? undefined,
      html: this.layout(
        `Pedido ${order.code}`,
        `<p style="margin:0 0 16px;">Um novo pedido chegou pelo site.</p>
         ${this.table(customerRows)}
         <p style="margin:20px 0 8px;font-weight:600;">Entrega</p>
         <p style="margin:0;white-space:pre-wrap;">${escapeHtml(address)}</p>
         <p style="margin:8px 0 0;color:#555;">${escapeHtml(order.shippingCarrier ?? 'Frete')}${escapeHtml(shippingDays)} — ${currency.format(order.shippingPrice)}</p>
         ${
           order.notes
             ? `<p style="margin:20px 0 8px;font-weight:600;">Observações</p>
                <p style="margin:0;white-space:pre-wrap;">${escapeHtml(order.notes)}</p>`
             : ''
         }
         <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
           <thead>
             <tr>
               <th style="text-align:left;padding-bottom:8px;">Peça</th>
               <th style="text-align:center;padding-bottom:8px;">Qtd.</th>
               <th style="text-align:right;padding-bottom:8px;">Preço</th>
             </tr>
           </thead>
           <tbody>${itemRows}</tbody>
         </table>
         <p style="margin:12px 0 0;text-align:right;">Subtotal: ${currency.format(order.subtotalPrice)}</p>
         <p style="margin:4px 0 0;text-align:right;font-size:16px;font-weight:700;">Total: ${currency.format(order.totalPrice)}</p>`,
      ),
    });
  }

  private async send(message: {
    subject: string;
    html: string;
    replyTo?: string;
  }): Promise<void> {
    if (!this.resend || !this.notifyTo) {
      this.logger.warn(
        'E-mail não enviado: defina RESEND_API_KEY e NOTIFY_EMAIL.',
      );
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [this.notifyTo],
        subject: message.subject,
        html: message.html,
        replyTo: message.replyTo,
      });

      if (error) {
        this.logger.error(
          `Falha ao enviar "${message.subject}": ${error.message}`,
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao enviar "${message.subject}": ${reason}`);
    }
  }

  private layout(title: string, body: string): string {
    return `<div style="font-family:Georgia,serif;color:#2b2118;max-width:560px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 4px;letter-spacing:0.08em;font-size:12px;text-transform:uppercase;color:#8a6a52;">Maya Crochê</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;">${escapeHtml(title)}</h1>
      ${body}
    </div>`;
  }

  private table(rows: Array<[string, string]>): string {
    const body = rows
      .map(
        ([label, value]) =>
          `<tr>
            <td style="padding:6px 12px 6px 0;color:#8a6a52;vertical-align:top;">${escapeHtml(label)}</td>
            <td style="padding:6px 0;">${escapeHtml(value)}</td>
          </tr>`,
      )
      .join('');

    return `<table style="border-collapse:collapse;font-size:15px;">${body}</table>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
