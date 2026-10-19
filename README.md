# Gestão de Estoque

Sistema de gestão de estoque para pequenos negócios, construído em torno de um
caso real: uma **fábrica de massas**. Projeto full stack de portfólio, com foco
em código profissional, legível e defensável.

Permite cadastrar produtos, registrar entradas e saídas de estoque de forma
consistente, acompanhar indicadores em um dashboard, receber alertas de estoque
baixo, importar/exportar planilhas e auditar as ações sensíveis — tudo com
autenticação e controle de acesso por papel.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict) |
| Estilo | **Tailwind CSS v4** + **shadcn/ui** + `next-themes` (dark mode) |
| Dados (client) | **TanStack Query** · tabelas com **TanStack Table** |
| Gráficos | **Recharts** |
| Formulários | **React Hook Form** + **Zod** (mesmo schema valida no servidor) |
| Backend | Route Handlers + **Server Actions** do Next (monólito) |
| ORM / Banco | **Prisma** + **PostgreSQL 16** |
| Autenticação | **Auth.js v5** (Credentials, sessão JWT) com papéis (dono / funcionário) |
| Planilhas | **ExcelJS** (import/export .xlsx e .csv) |
| Container | **Docker** + **docker-compose** (app + postgres) |

---

## Funcionalidades

- **Autenticação** com e-mail/senha (hash **bcrypt**), sessão JWT e proteção de
  rotas por middleware + verificação no servidor.
- **CRUD de produtos** com tabela rica: busca, ordenação, paginação e filtro por
  categoria; validação no client e no servidor; toasts e confirmação de exclusão.
- **Movimentações de estoque** (entrada/saída) ajustando a quantidade de forma
  **atômica (transação)**; saídas não podem deixar o estoque negativo; histórico
  geral e por produto, filtrável por tipo e período.
- **Dashboard** com cards de resumo e gráficos (entradas × saídas no tempo,
  produtos com estoque mais baixo) e movimentações recentes.
- **Alertas de estoque baixo**: lista dedicada priorizada, card clicável no
  dashboard e contador na sidebar.
- **Import/Export Excel**: importação com preview e validação linha a linha
  (relatório de erros) antes de confirmar; exportação de produtos e movimentações;
  modelo (template) para download.
- **Auditoria**: toda ação sensível é registrada; tela visível apenas ao **OWNER**.
- **UX**: responsivo (sidebar colapsável + drawer no mobile), dark mode sem flash,
  skeletons, estados de erro e vazio, acessibilidade básica e formatação pt-BR
  (datas, números e moeda R$).

---

## Decisões de arquitetura

- **Borda fina, núcleo testável.** A lógica de negócio vive em `src/server/*`
  (serviços que falam com o Prisma). As Server Actions em `src/lib/actions/*` são
  só a borda: autenticam, validam com Zod e delegam ao serviço. Assim a mesma
  lógica serve a Route Handlers e Actions, e fica isolada da UI.
- **Validação única com Zod.** O mesmo schema valida no formulário (client) e
  **novamente no servidor** — nunca se confia no client. Vale para mutações e
  para a importação de planilhas.
- **Auth.js dividido em config edge-safe + node.** `auth.config.ts` (sem
  Prisma/bcrypt) é o que o middleware importa e roda no edge; `auth.ts` adiciona
  o provider Credentials com a lógica pesada (Node). Mantém o bundle do
  middleware leve e correto.
- **Sessão JWT.** O provider Credentials do Auth.js v5 não suporta estratégia de
  banco; o `role` viaja no token e é exposto em `session.user.role`.
- **Dinheiro e quantidades em `Decimal`.** Preços em `Decimal(12,2)` e
  quantidades em `Decimal(12,3)` (venda fracionada, ex.: kg). Agregações de valor
  usam `Decimal` para evitar erro de float. A conversão para `number` acontece
  apenas na borda de serialização (DTO), para exibição.
- **Regra de unidade.** Unidades "inteiras" (un, pacote, caixa) rejeitam
  quantidade fracionada; unidades como kg/g/litro aceitam fração.
- **Transações para integridade.** Registrar uma movimentação cria o log e
  atualiza a quantidade do produto na mesma transação; se qualquer passo falha,
  nada é persistido.

---

## Modelo de dados

- **User**: nome, email (único), senha (hash), `role` (`OWNER` | `EMPLOYEE`).
- **Product**: nome, SKU (único), descrição, categoria, preço de custo/venda,
  quantidade atual, quantidade mínima (limiar de alerta), unidade.
- **StockMovement**: produto, tipo (`IN` | `OUT`), quantidade, motivo, usuário.
- **AuditLog**: usuário, ação, entidade, id da entidade, detalhes (JSON).

Migrations versionadas pelo Prisma em `prisma/migrations`.

---

## Como rodar

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose

### Desenvolvimento (Postgres no Docker, app local)

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env            # Windows/PowerShell: Copy-Item .env.example .env
#    Gere um AUTH_SECRET: npx auth secret

# 3. Banco de dados
docker compose up -d db

# 4. Schema + dados de exemplo
npm run db:migrate              # aplica as migrations
npm run db:seed                 # 2 usuários + 12 produtos + histórico

# 5. Rodar
npm run dev                     # http://localhost:3000
```

> O Postgres é exposto na porta **5433** do host (para não conflitar com outros
> Postgres na 5432). Ajuste a `DATABASE_URL` se necessário.

### Stack completa em Docker (app + banco)

```bash
AUTH_SECRET="$(openssl rand -base64 32)" docker compose --profile full up -d --build
```

Ordem de subida: o banco fica saudável → o serviço `migrate` aplica as
migrations (`prisma migrate deploy`) e encerra → o app (imagem slim) sobe em
http://localhost:3000. Para popular dados de exemplo:

```bash
docker compose --profile full run --rm migrate npx prisma db seed
```

### Credenciais de teste (seed)

| Papel | Email | Senha |
| --- | --- | --- |
| Dono (OWNER) | dono@massas.com | owner123 |
| Funcionário (EMPLOYEE) | funcionario@massas.com | employee123 |

> O funcionário não vê a Auditoria nem exclui produtos (controle de acesso fino).

---

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Next em modo desenvolvimento |
| `npm run build` / `npm run start` | Build e execução de produção |
| `npm run db:migrate` | Cria/aplica migrations (Prisma) |
| `npm run db:seed` | Popula dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:reset` | Reseta o banco e reaplica migrations + seed |

---

## Estrutura de pastas

```
src/
  app/
    (auth)/login/            # login público
    (app)/                   # grupo protegido (dashboard, products, movements,
                             #   alerts, audit) — layout com sidebar/topbar
    api/                     # route handlers (products, movements, audit,
                             #   export/import, auth)
  components/
    ui/                      # componentes shadcn/ui
    layout/ data-table/      # shell, navegação e utilitários de tabela
    products/ movements/     # features por domínio
    dashboard/ alerts/ audit/
  hooks/                     # TanStack Query (queries + mutations)
  lib/
    actions/                 # Server Actions (borda: auth + Zod + delega)
    validations/             # schemas Zod compartilhados
    auth.ts auth.config.ts   # Auth.js (node + edge-safe)
    prisma.ts format.ts errors.ts utils.ts
  server/                    # lógica de negócio (products, movements,
                             #   dashboard, audit, excel)
  types/                     # DTOs serializáveis
prisma/                      # schema, migrations, seed
```

---

## Screenshots

> _A adicionar: login, dashboard (light/dark), produtos, movimentações,
> alertas, importação com preview e auditoria._

---

## Notas

- O deploy em VPS será tratado à parte.
- Rodando o projeto dentro do OneDrive no Windows? Exclua `node_modules` e
  `.next` da sincronização — o lock de arquivos do OneDrive interfere no
  `prisma generate` e no build.
