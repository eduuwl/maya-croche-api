# Maya Crochê — Contrato de frete

Especificação para implementação na API Nest. Complementa [api-contract.md](./api-contract.md) e [backend.md](../backend.md).

**Base URL:** `NEXT_PUBLIC_API_URL`  
**Formato:** `application/json`  
**Auth:** nenhuma (rota pública)

---

## Índice

1. [Resumo](#1-resumo)
2. [POST /shipping/quote](#2-post-shippingquote--cotação)
3. [Regras de negócio](#3-regras-de-negócio-sugeridas)
4. [Impacto em POST /orders](#4-impacto-em-post-orders)
5. [Admin](#5-admin)
6. [Fluxo no frontend](#6-fluxo-no-frontend)
7. [Mock de referência](#7-mock-de-referência)
8. [Checklist](#8-checklist-para-o-backend)
9. [Tipos no frontend](#9-tipos-no-frontend)

---

## 1. Resumo

| Endpoint | Situação hoje | Ação |
|----------|---------------|------|
| `POST /shipping/quote` | Não existe na API | **Implementar** |
| `POST /orders` | `totalPrice` = só produtos | **Somar frete** |
| `GET /admin/orders` | Sem campos de frete | **Retornar frete no `Order`** |

**Regra de ouro:** o cliente **nunca envia** valor de frete. O backend calcula com CEP + itens (mesma lógica do preço do produto).

---

## 2. `POST /shipping/quote` — cotação

### 2.1 v1 — página do produto (já no frontend)

Usado em `components/products/ShippingCalculator.tsx`.

#### Request

```ts
interface ShippingQuoteRequestV1 {
  productId: string;
  cep: string;  // 8 dígitos, sem hífen
}
```

```json
{
  "productId": "cmrjupdol001wkv9cugo6yjlp",
  "cep": "66055000"
}
```

#### Response `200`

```ts
interface ShippingQuote {
  carrier: string;
  price: number;
  estimatedDays?: number;
}
```

```json
{
  "carrier": "Correios PAC",
  "price": 28.9,
  "estimatedDays": 8
}
```

#### Erros

| Situação | Status | `message` sugerida |
|----------|--------|-------------------|
| CEP inválido | `400` | `CEP inválido. Informe os 8 dígitos.` |
| Produto não encontrado | `404` | `Produto não encontrado.` |
| Sem cobertura / falha transportadora | `422` ou `502` | texto livre |

Formato de erro Nest padrão: `{ "statusCode", "message" }` — `message` pode ser `string` ou `string[]`.

---

### 2.2 v2 — carrinho / checkout (recomendado)

Mesmo endpoint, body com múltiplos itens:

```ts
interface ShippingQuoteRequestV2 {
  cep: string;
  items: {
    productId: string;
    quantity: number;  // inteiro ≥ 1
  }[];
}
```

```json
{
  "cep": "66055000",
  "items": [
    { "productId": "cmrj...", "quantity": 2 },
    { "productId": "cmrk...", "quantity": 1 }
  ]
}
```

**Response:** mesmo `ShippingQuote` (uma opção).  
**Futuro:** múltiplas opções → `{ options: ShippingQuote[] }`.

**Implementação sugerida no backend:** aceitar v1 e v2 no mesmo handler (presença de `items` vs `productId`).

---

## 3. Regras de negócio sugeridas

| Regra | Detalhe |
|-------|---------|
| CEP | 8 dígitos; frontend envia sem máscara |
| Produtos | Buscar por `id`; ignorar preço enviado pelo client |
| Peso | `Product` ainda não tem peso — usar tabela fixa ou heurística até ter dados reais |
| Origem | CEP da loja em env: `SHIPPING_ORIGIN_ZIP` ou `SiteConfig` |
| `readyToShip` | Futuro: frete grátis ou modalidade expressa (campo ainda ausente na API) |
| Valores | `price` em BRL (`number`); no banco pode ser `Int` em centavos como produtos |

---

## 4. Impacto em `POST /orders`

### Situação atual

```ts
// Backend hoje
totalPrice = Σ(unitPrice × quantity)  // só produtos
```

### Request — sem mudança

O frontend já envia tudo que o backend precisa:

```ts
interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;   // ← CEP para calcular frete
  notes?: string;
  items: {
    productId: string;
    size?: string;
    color?: string;
    quantity: number;
  }[];
}
```

**Não enviar** (e **não aceitar** no backend): `shippingPrice`, `shippingCarrier`.

### Lógica ao criar pedido

1. Validar itens → **subtotal**
2. `calculateShipping(addressZipCode, items)` → **frete**
3. Persistir snapshot do frete
4. `totalPrice = subtotalPrice + shippingPrice`

### Modelo Prisma sugerido

```prisma
model Order {
  // existentes...
  subtotalPrice         Int
  shippingPrice         Int      @default(0)
  shippingCarrier       String?
  shippingEstimatedDays Int?
  totalPrice            Int      // subtotal + frete
}
```

### Response `Order` atualizada

```ts
interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes: string | null;

  subtotalPrice: number;
  shippingPrice: number;
  shippingCarrier: string | null;
  shippingEstimatedDays?: number;
  totalPrice: number;

  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
```

**Exemplo:**

```json
{
  "id": "cmrjute1r0000kvzgj69nnbau",
  "code": "MC-000001",
  "status": "PENDING",
  "customerName": "Maria Teste",
  "customerPhone": "11999998888",
  "customerEmail": null,
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": null,
    "neighborhood": "Centro",
    "city": "Belém",
    "state": "PA",
    "zipCode": "66000000"
  },
  "notes": null,
  "subtotalPrice": 580,
  "shippingPrice": 32.5,
  "shippingCarrier": "Correios PAC",
  "shippingEstimatedDays": 8,
  "totalPrice": 612.5,
  "items": [
    {
      "id": "...",
      "productId": "prod-010",
      "productName": "Conjunto Encanto Duo",
      "productSlug": "conjunto-encanto-duo",
      "unitPrice": 290,
      "size": "M",
      "color": null,
      "quantity": 2
    }
  ],
  "createdAt": "2026-07-13T23:29:10.239Z",
  "updatedAt": "2026-07-13T23:29:10.239Z"
}
```

---

## 5. Admin

`GET /admin/orders` e `GET /admin/orders/:id` retornam o mesmo `Order` com campos de frete.

O painel `/admin/pedidos` exibirá subtotal, frete e total — sem endpoint extra.

---

## 6. Fluxo no frontend

```text
┌─────────────────┐     POST /shipping/quote      ┌─────────┐
│ Página produto  │ ─── { productId, cep } ────► │   API   │
└─────────────────┘ ◄── ShippingQuote ────────── └─────────┘

┌─────────────────┐     POST /shipping/quote      ┌─────────┐
│ Carrinho        │ ─── { cep, items[] } ───────► │   API   │
└─────────────────┘ ◄── ShippingQuote ────────── └─────────┘
         │
         │ POST /orders (sem frete no body)
         ▼
┌─────────────────┐     Order com frete           ┌─────────┐
│ Confirmação     │ ◄──────────────────────────── │   API   │
└─────────────────┘                               └─────────┘
```

**Pendente no frontend** (após API): cotação no checkout + breakdown na confirmação e no admin.

---

## 7. Mock de referência

`lib/data/mock.ts` simula cotação por região (primeiro dígito do CEP). Substituir por integração real (Correios, Melhor Envio, etc.).

---

## 8. Checklist para o backend

- [ ] `POST /shipping/quote` v1 (`productId` + `cep`)
- [ ] `POST /shipping/quote` v2 (`cep` + `items[]`)
- [ ] Serviço `calculateShipping()` compartilhado entre quote e order
- [ ] Migration: campos de frete em `Order`
- [ ] `POST /orders`: `totalPrice = subtotal + shipping`
- [ ] Admin orders retornam novos campos
- [ ] Env: `SHIPPING_ORIGIN_ZIP` (+ credenciais transportadora)

---

## 9. Tipos no frontend

**Hoje** (`lib/types.ts`):

```ts
interface ShippingQuoteRequest {
  productId: string;
  cep: string;
}

interface ShippingQuote {
  carrier: string;
  price: number;
  estimatedDays?: number;
}
```

**Após API com frete no pedido** — atualizar para:

```ts
type ShippingQuoteRequest =
  | { productId: string; cep: string }
  | { cep: string; items: { productId: string; quantity: number }[] };

interface Order {
  // campos existentes +
  subtotalPrice: number;
  shippingPrice: number;
  shippingCarrier: string | null;
  shippingEstimatedDays?: number;
}
```

Arquivos a alterar no frontend: `lib/types.ts`, `lib/data/api.ts`, `components/cart/CheckoutForm.tsx`, `app/admin/pedidos/[id]/page.tsx`.
