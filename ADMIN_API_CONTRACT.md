# Maya Crochê — Contrato da API Administrativa

Este documento complementa o contrato público já existente (`/products`, `/categories`, `/collections`, `/site`) e descreve tudo que foi adicionado para a **área administrativa**: login, CRUD de produtos/categorias/coleções/configuração do site, upload de imagens, e recebimento de **pedidos**, **orçamentos** e **mensagens de contato**.

**Base URL:** mesma do contrato público (`NEXT_PUBLIC_API_URL`)
**Formato:** `application/json` (upload de imagem usa `multipart/form-data`)
**Auth:** JWT Bearer token nas rotas marcadas com 🔒

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Convenções gerais](#2-convenções-gerais)
3. [Usuários admin](#3-usuários-admin)
4. [Produtos (CRUD admin)](#4-produtos-crud-admin)
5. [Categorias (CRUD admin)](#5-categorias-crud-admin)
6. [Coleções (CRUD admin)](#6-coleções-crud-admin)
7. [Configuração do site (edição)](#7-configuração-do-site-edição)
8. [Upload de imagens](#8-upload-de-imagens)
9. [Pedidos (checkout público + admin)](#9-pedidos-checkout-público--admin)
10. [Orçamentos (público + admin)](#10-orçamentos-público--admin)
11. [Contato (público + admin)](#11-contato-público--admin)
12. [Variáveis de ambiente novas](#12-variáveis-de-ambiente-novas)
13. [Sugestão de implementação no frontend](#13-sugestão-de-implementação-no-frontend)

---

## 1. Autenticação

Login gera um **JWT** que deve ser enviado em todas as rotas protegidas (🔒) no header:

```
Authorization: Bearer <accessToken>
```

O token expira (`JWT_EXPIRES_IN`, hoje `1d`). Quando expirar, as rotas protegidas retornam `401` — o frontend deve deslogar e mandar pra tela de login.

### `POST /auth/login`

**Body:**

```json
{
  "email": "admin@mayacroche.com.br",
  "password": "sua-senha"
}
```

**Resposta `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cmrjupdol001wkv9cugo6yjlp",
    "name": "Admin",
    "email": "admin@mayacroche.com.br",
    "role": "ADMIN",
    "createdAt": "2026-07-13T23:26:03.142Z"
  }
}
```

**Erro `401`** se email/senha inválidos: `{ "message": "Unauthorized", "statusCode": 401 }` (login sempre retorna 401 genérico, nunca diz se foi o email ou a senha que errou).

### `GET /auth/me` 🔒

Retorna o usuário do token atual (útil pra validar sessão ao recarregar a página admin). Resposta igual ao `user` do login.

---

## 2. Convenções gerais

- **Rotas públicas** (sem 🔒): mesma política de CORS/leitura livre do contrato original.
- **Rotas admin** (🔒): exigem `Authorization: Bearer <token>` válido. Sem token ou token inválido/expirado → `401`.
- **Validação:** todo `POST`/`PATCH` valida o body. Campo extra não documentado → `400`. Campo obrigatório faltando ou tipo errado → `400` com lista de mensagens:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "name must be longer than or equal to 2 characters",
    "email must be an email"
  ]
}
```

- **Não encontrado:** `404` com `{ "statusCode": 404, "error": "Not Found", "message": "..." }`.
- **Conflito** (slug/email duplicado, exclusão bloqueada por vínculo): `409` com o mesmo formato acima.
- **Delete com sucesso:** `204 No Content` (sem body).
- **IDs:** todo recurso administrativo é identificado por `id` (cuid), não por slug — diferente das rotas públicas de produto que usam slug.

---

## 3. Usuários admin

Multi-admin: dá pra cadastrar mais de um usuário com acesso ao painel. Todas as rotas são 🔒.

| Método | Path | Descrição |
|---|---|---|
| GET | `/admin/users` | Lista todos os admins |
| GET | `/admin/users/:id` | Detalhe de um admin |
| POST | `/admin/users` | Cria novo admin |
| PATCH | `/admin/users/:id` | Edita nome/email/senha |
| DELETE | `/admin/users/:id` | Remove um admin |

**`User` (resposta, nunca inclui senha):**

```ts
{
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  createdAt: string; // ISO date
}
```

**Create/Update body:**

```json
{ "name": "Maya", "email": "maya@mayacroche.com.br", "password": "mínimo8chars" }
```

`password` é opcional no `PATCH` (só manda se for trocar a senha).

**Regras:**
- Não é possível excluir o próprio usuário logado (`403`).
- Não é possível excluir o último admin restante (`403`) — sempre sobra pelo menos um.
- Email duplicado → `409`.

---

## 4. Produtos (CRUD admin)

As rotas públicas `GET /products` e `GET /products/:slug` **não mudaram**. As novas rotas de escrita:

| Método | Path | Descrição |
|---|---|---|
| POST | `/admin/products` 🔒 | Cria produto |
| PATCH | `/admin/products/:id` 🔒 | Edita produto (parcial) |
| DELETE | `/admin/products/:id` 🔒 | Remove produto |

**Create body** (mesmo shape do `Product` do contrato original, exceto que aqui usa `id` como identificador de edição, não `slug`):

```json
{
  "slug": "vestido-daisy-floral",
  "name": "Vestido Daisy Floral",
  "description": "Vestido longo em crochê com motivo floral delicado.",
  "price": 380,
  "categorySlug": "vestidos",
  "collectionSlug": "daisy",
  "images": ["https://res.cloudinary.com/.../daisy-1.jpg"],
  "sizes": ["P", "M", "G"],
  "featured": true,
  "bestSeller": true,
  "colors": ["Off-white", "Rosa antigo"]
}
```

**Update body:** os mesmos campos, todos opcionais (`PATCH` parcial — só manda o que quer mudar).

**Regras importantes:**
- `slug` precisa ser único (`^[a-z0-9]+(-[a-z0-9]+)*$`) — se repetir, `409`.
- `categorySlug` precisa existir (senão `404`); `collectionSlug` se enviado também precisa existir, ou pode ser `null`/omitido para produto sem coleção.
- `images` e `sizes`: mínimo 1 item cada.
- `sizes` aceita só os valores do enum: `"PP" | "P" | "M" | "G" | "GG" | "Único"`.
- Ao dar `PATCH` em `images`, `sizes` ou `colors`, a lista **inteira é substituída** pela enviada (não é um merge/append) — o frontend deve sempre mandar a lista completa desejada.
- Excluir um produto **não afeta pedidos antigos** que já o referenciam (o pedido guarda uma cópia congelada do nome/preço no momento da compra).

---

## 5. Categorias (CRUD admin)

`GET /categories` (pública) não mudou.

| Método | Path | Descrição |
|---|---|---|
| POST | `/admin/categories` 🔒 | Cria categoria |
| PATCH | `/admin/categories/:id` 🔒 | Edita categoria |
| DELETE | `/admin/categories/:id` 🔒 | Remove categoria |

**Body:**

```json
{ "slug": "vestidos", "name": "Vestidos", "description": "Peças fluidas..." }
```

Todos os campos são opcionais no `PATCH`. Excluir uma categoria **com produtos vinculados** retorna `409` — é preciso mover ou excluir os produtos antes.

---

## 6. Coleções (CRUD admin)

`GET /collections` (pública) não mudou.

| Método | Path | Descrição |
|---|---|---|
| POST | `/admin/collections` 🔒 | Cria coleção |
| PATCH | `/admin/collections/:id` 🔒 | Edita coleção |
| DELETE | `/admin/collections/:id` 🔒 | Remove coleção |

**Body:**

```json
{
  "slug": "daisy",
  "name": "Coleção Daisy",
  "description": "O boho que faltava no seu guarda-roupa.",
  "tagline": "Boho que faltava no seu guarda-roupa",
  "image": "https://res.cloudinary.com/.../daisy-cover.jpg",
  "featured": true
}
```

Mesma regra de exclusão bloqueada por produtos vinculados (`409`).

---

## 7. Configuração do site (edição)

`GET /site` (pública) não mudou.

### `PATCH /admin/site` 🔒

Edição parcial — manda só as seções/campos que quer atualizar. **Atenção:** se enviar `about.paragraphs` ou `measures.rows`, a lista inteira anterior é substituída pela nova (mande a lista completa, não só o item alterado).

```json
{
  "name": "Maya Crochê",
  "tagline": "Arte que veste...",
  "hero": { "title": "...", "subtitle": "...", "ctaLabel": "...", "ctaHref": "/produtos" },
  "about": { "title": "...", "paragraphs": ["novo parágrafo 1", "novo parágrafo 2"], "artisanName": "Maya" },
  "contact": { "whatsapp": "5511999999999", "email": "contato@mayacroche.com.br", "city": "Belém — PA" },
  "measures": {
    "intro": "...",
    "rows": [{ "size": "PP", "bust": "80–84", "waist": "60–64", "hip": "86–90" }]
  }
}
```

Resposta: o `SiteConfig` completo atualizado (mesmo shape do `GET /site`).

---

## 8. Upload de imagens

Imagens (de produto ou de coleção) são hospedadas no **Cloudinary**. O fluxo é sempre em 2 passos: primeiro sobe o arquivo, depois usa a URL retornada no `images`/`image` do produto/coleção.

### `POST /admin/uploads` 🔒

`Content-Type: multipart/form-data`, campo do arquivo chamado **`file`**.

- Formatos aceitos: `jpeg`, `png`, `webp`, `avif`.
- Tamanho máximo: 5MB.

**Resposta `201`:**

```json
{
  "url": "https://res.cloudinary.com/xxx/image/upload/v123/maya-croche/products/abc123.jpg",
  "publicId": "maya-croche/products/abc123"
}
```

Use `url` diretamente no array `images` do produto (ou no campo `image` da coleção).

**Exemplo (fetch no frontend):**

```ts
const formData = new FormData();
formData.append('file', file); // file: File do <input type="file">

const res = await fetch(`${API_URL}/admin/uploads`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData, // NÃO defina Content-Type manualmente, o browser seta o boundary
});
const { url } = await res.json();
```

---

## 9. Pedidos (checkout público + admin)

Como o frontend ainda não tem carrinho/checkout, este é o ponto de partida: o cliente monta o carrinho no client-side, preenche os dados de entrega e manda **um único POST** com tudo. Não há gateway de pagamento — o pedido cai como `PENDING` e o fechamento (pagamento/combinação) é feito manualmente pela loja, provavelmente por WhatsApp.

### `POST /orders` (pública)

```json
{
  "customerName": "Maria Teste",
  "customerPhone": "11999998888",
  "customerEmail": "maria@exemplo.com",
  "addressStreet": "Rua das Flores",
  "addressNumber": "123",
  "addressComplement": "Apto 45",
  "addressNeighborhood": "Centro",
  "addressCity": "Belém",
  "addressState": "PA",
  "addressZipCode": "66000000",
  "notes": "Entregar após as 18h",
  "items": [
    { "productId": "prod-010", "size": "M", "color": "Off-white", "quantity": 2 }
  ]
}
```

- `productId` é o `id` do produto (não o `slug` — pegue do array de produtos carregado do `GET /products`, campo `id`).
- `unitPrice`, `productName`, `productSlug` e `totalPrice` **não são enviados pelo cliente** — o backend busca o produto pelo `id` e calcula tudo a partir do preço atual no banco (o cliente não controla o preço).
- `customerEmail`, `addressComplement` e `notes` são opcionais.

**Resposta `201`:**

```json
{
  "id": "cmrjute1r0000kvzgj69nnbau",
  "code": "MC-000001",
  "status": "PENDING",
  "customerName": "Maria Teste",
  "customerPhone": "11999998888",
  "customerEmail": null,
  "address": { "street": "Rua das Flores", "number": "123", "complement": null, "neighborhood": "Centro", "city": "Belém", "state": "PA", "zipCode": "66000000" },
  "notes": null,
  "totalPrice": 580,
  "items": [
    { "id": "...", "productId": "prod-010", "productName": "Conjunto Encanto Duo", "productSlug": "conjunto-encanto-duo", "unitPrice": 290, "size": "M", "color": null, "quantity": 2 }
  ],
  "createdAt": "2026-07-13T23:29:10.239Z",
  "updatedAt": "2026-07-13T23:29:10.239Z"
}
```

Mostre o `code` (ex: `MC-000001`) pro cliente como número de referência do pedido — é mais amigável que o `id`.

### Admin

| Método | Path | Descrição |
|---|---|---|
| GET | `/admin/orders` 🔒 | Lista todos os pedidos (mais recentes primeiro) |
| GET | `/admin/orders/:id` 🔒 | Detalhe de um pedido |
| PATCH | `/admin/orders/:id` 🔒 | Atualiza status e/ou notas internas |

**`PATCH` body:**

```json
{ "status": "CONFIRMED", "notes": "Cliente confirmou pagamento via Pix" }
```

**`OrderStatus`:** `"PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELED"`

---

## 10. Orçamentos (público + admin)

Formulário de "peça personalizada" — cliente descreve o que quer e a loja responde depois (por WhatsApp/email, fora do sistema).

### `POST /quotes` (pública)

```json
{
  "name": "Joana",
  "phone": "11988887777",
  "email": "joana@exemplo.com",
  "description": "Quero um vestido personalizado tamanho G, cor terracota"
}
```

`email` é opcional. Resposta `201` com o registro criado (`status: "NEW"`).

### Admin

| Método | Path | Descrição |
|---|---|---|
| GET | `/admin/quotes` 🔒 | Lista orçamentos (mais recentes primeiro) |
| GET | `/admin/quotes/:id` 🔒 | Detalhe |
| PATCH | `/admin/quotes/:id` 🔒 | Atualiza status e/ou nota interna |

```json
{ "status": "ANSWERED", "adminNotes": "Respondido por WhatsApp em 13/07" }
```

**`QuoteStatus`:** `"NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED"`

---

## 11. Contato (público + admin)

Formulário de contato genérico ("fale conosco").

### `POST /contact` (pública)

```json
{ "name": "Carlos", "email": "carlos@exemplo.com", "phone": "11977776666", "message": "Gostaria de saber sobre prazo de entrega" }
```

`phone` é opcional. Resposta `201` com o registro criado (`status: "NEW"`).

### Admin

| Método | Path | Descrição |
|---|---|---|
| GET | `/admin/contact` 🔒 | Lista mensagens (mais recentes primeiro) |
| GET | `/admin/contact/:id` 🔒 | Detalhe |
| PATCH | `/admin/contact/:id` 🔒 | Atualiza status |

```json
{ "status": "READ" }
```

**`ContactStatus`:** `"NEW" | "READ" | "ANSWERED"`

---

## 12. Variáveis de ambiente novas

Além das já existentes (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`), agora a API também precisa de:

```env
JWT_SECRET=algum-segredo-forte
JWT_EXPIRES_IN=1d

# Criação do admin inicial (rodada pelo prisma/seed.ts, só cria se não existir usuário com esse email)
ADMIN_SEED_NAME=Admin
ADMIN_SEED_EMAIL=admin@mayacroche.com.br
ADMIN_SEED_PASSWORD=defina-uma-senha-forte

# Conta Cloudinary usada pelo POST /admin/uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Isso não afeta o frontend diretamente (são variáveis só da API), mas é bom saber que o login inicial do painel é o par `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` configurado no ambiente da API.

---

## 13. Sugestão de implementação no frontend

1. **Login (`/admin/login`):** form simples de email/senha → `POST /auth/login` → salva `accessToken` (localStorage ou cookie) e os dados de `user`.
2. **Layout admin protegido:** ao entrar em qualquer rota `/admin/*`, chama `GET /auth/me` com o token salvo; se der `401`, redireciona pro login.
3. **Client HTTP admin:** um wrapper parecido com o `lib/data/api.ts` público, mas que injeta `Authorization: Bearer <token>` em toda chamada e trata `401` global (desloga automaticamente).
4. **Telas sugeridas:**
   - **Dashboard**: contadores rápidos (pedidos pendentes, orçamentos novos, mensagens novas) — pode vir de `GET /admin/orders`, `/admin/quotes`, `/admin/contact` filtrando no client por status, já que os endpoints ainda não têm filtro por query string.
   - **Produtos**: listagem (reusa `GET /products` já que retorna tudo) + formulário de criar/editar usando `POST`/`PATCH /admin/products`, com upload de imagem via `POST /admin/uploads` antes de salvar.
   - **Categorias / Coleções**: CRUD simples, mesma lógica.
   - **Configurações do site**: um form único editando `PATCH /admin/site`.
   - **Pedidos**: lista com status, tela de detalhe pra mudar status (`PATCH /admin/orders/:id`).
   - **Orçamentos** e **Contato**: listas simples com detalhe e mudança de status.
   - **Usuários**: tela pra gerenciar outros admins (opcional/pode vir depois).
5. **Erros de validação:** o array em `message` do `400` já vem em inglês (mensagens padrão do `class-validator`) — se quiser mensagens em português, isso precisa ser tratado no frontend (mapear campo → mensagem customizada) ou pedido como ajuste futuro na API.
