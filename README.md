# BarberApp — Frontend

SaaS de agendamento para barbearias. Multi-tenant: cada barbearia é um cliente com seu próprio painel e página pública de agendamento.

---

## Stack

| Ferramenta                  | Uso                     |
| --------------------------- | ----------------------- |
| React 19 + TypeScript       | UI                      |
| Vite                        | Build                   |
| Tailwind CSS v3 + shadcn/ui | Estilo e componentes    |
| React Query v5              | Server state            |
| React Hook Form + Zod       | Formulários e validação |
| Zustand                     | Auth state (token JWT)  |
| Axios                       | HTTP client             |
| date-fns                    | Manipulação de datas    |
| React Router v7             | Roteamento              |

---

## Variáveis de ambiente

Crie um `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8080
```

---

## Rodar localmente

```bash
npm install
npm run dev
```

---

## Mapa de rotas

```
/                        → redireciona para /admin/login
/booking/:slug           → página pública de agendamento (sem login)
/admin/login             → login do painel admin
/admin/dashboard         → dashboard (protegido)
/admin/appointments      → agenda completa (protegido)
/admin/barbers           → gestão de Funcionarios (protegido)
/admin/services          → gestão de serviços (protegido)
/admin/schedule          → horários de trabalho (protegido)
/admin/billing           → faturamento / assinatura (protegido)
/super/tenants           → criar tenants (apenas SUPER_ADMIN)
```

---

## Páginas

### `/booking/:slug` — Agendamento público

**Arquivo:** `src/pages/booking/BookingPage.tsx`  
**Acesso:** público, sem login  
**Quem usa:** clientes finais da barbearia

Fluxo em 4 passos:

```
1. Escolhe o serviço       → StepSelectService.tsx
2. Escolhe o Funcionario      → StepSelectBarber.tsx
3. Escolhe data e horário  → StepSelectDateTime.tsx
4. Informa nome e telefone → StepClientInfo.tsx
                           → StepSuccess.tsx (tela de confirmação)
```

Cada passo consome as rotas públicas do backend (`/api/public/{slug}/...`). Não é necessário JWT.

---

### `/admin/login` — Login

**Arquivo:** `src/pages/admin/LoginPage.tsx`  
**Acesso:** público

Formulário de e-mail + senha. Ao autenticar, salva `accessToken` e `refreshToken` no Zustand (persistido no `localStorage`). Redireciona para `/admin/dashboard`.

---

### `/admin/dashboard` — Dashboard

**Arquivo:** `src/pages/admin/DashboardPage.tsx`  
**Acesso:** OWNER ou BARBER

Visão geral do dia atual:

- Cards de métricas: total de agendamentos, pendentes, confirmados, concluídos
- Tabela com todos os agendamentos do dia
- Ações rápidas: confirmar, cancelar, concluir cada agendamento

---

### `/admin/appointments` — Agenda completa

**Arquivo:** `src/pages/admin/AppointmentsPage.tsx`  
**Acesso:** OWNER ou BARBER

- Filtros por data e por status (Pendente / Confirmado / Cancelado / Concluído)
- Tabela paginável com todos os agendamentos
- Botão para criar agendamento manual (abre dialog com formulário completo)
- Ações por linha: confirmar, concluir, cancelar

---

### `/admin/barbers` — Funcionarios

**Arquivo:** `src/pages/admin/BarbersPage.tsx`  
**Acesso:** OWNER

- Lista de Funcionarios com status ativo/inativo
- Criar e editar Funcionarios (nome + telefone)
- Remover Funcionario (com confirmação)
- Expandir Funcionario para ver/editar quais serviços ele oferece (checkboxes)

---

### `/admin/services` — Serviços

**Arquivo:** `src/pages/admin/ServicesPage.tsx`  
**Acesso:** OWNER

- Lista de serviços com preço e duração
- Criar e editar serviços (nome, duração em minutos, preço)
- Ativar/desativar serviço com toggle
- Remover serviço (com confirmação)

---

### `/admin/schedule` — Horários de trabalho

**Arquivo:** `src/pages/admin/SchedulePage.tsx`  
**Acesso:** OWNER

- Seleciona um Funcionario no dropdown
- Exibe os 7 dias da semana (Seg–Dom)
- Para cada dia: toggle ativo + horário de início + horário de fim
- Botão "Salvar" persiste via `PUT /api/admin/schedule/{barberId}`

---

### `/admin/billing` — Faturamento

**Arquivo:** `src/pages/admin/BillingPage.tsx`  
**Acesso:** OWNER

- Exibe status atual: em trial, assinatura ativa ou expirado
- Mostra quantos dias restam no trial
- Botão para assinar → chama `POST /api/admin/billing/checkout` e redireciona para o link de pagamento
- Botão para cancelar assinatura

> Quando o trial expira e não há assinatura ativa, o `AdminLayout` exibe um **overlay bloqueante** sobre todo o painel que só some após o pagamento ser confirmado via webhook no backend.

---

### `/super/tenants` — Criar tenants (Super Admin)

**Arquivo:** `src/pages/super/SuperTenantsPage.tsx`  
**Acesso:** apenas role `SUPER_ADMIN`

- Formulário: nome da barbearia, slug (ex: `minha-barbearia`), e-mail do dono
- Ao criar, o backend retorna uma **senha temporária**
- Essa senha é exibida na tela para ser entregue ao dono da barbearia

---

## Autenticação e controle de acesso

```
ProtectedRoute   → verifica se há accessToken no Zustand
RoleRoute        → verifica se user.role === role exigida
```

O axios interceptor (`src/api/axios.ts`) faz:

- Anexa `Authorization: Bearer <token>` em toda request
- Se receber **401**: tenta refresh automático do token
- Se receber **402**: redireciona para `/admin/billing?expired=true`

---

## Como criar o primeiro acesso

Não há tela de cadastro público. O fluxo é:

```
1. Inserir SUPER_ADMIN diretamente no banco (ou via seed do backend)
2. Acessar /super/tenants com essa conta
3. Criar o tenant da barbearia
4. Receber a senha temporária e entregá-la ao dono
5. Dono acessa /admin/login com o e-mail e a senha temporária
```

---

## Estrutura de pastas

```
src/
├── api/
│   ├── axios.ts          # instância axios + interceptors JWT/402
│   ├── auth.ts           # login, logout, refresh
│   ├── admin.ts          # appointments, barbers, services, schedule, billing
│   ├── public.ts         # rotas públicas de agendamento
│   └── super.ts          # criação de tenants
├── components/
│   ├── ui/               # shadcn/ui (button, input, dialog, select...)
│   ├── ProtectedRoute.tsx
│   ├── RoleRoute.tsx
│   └── StatusBadge.tsx
├── hooks/
│   └── useToast.ts
├── lib/
│   ├── utils.ts          # cn(), formatCurrency(), formatPhone()
│   └── jwt.ts            # decodeJwt()
├── pages/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AppointmentsPage.tsx
│   │   ├── BarbersPage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── SchedulePage.tsx
│   │   └── BillingPage.tsx
│   ├── booking/
│   │   ├── BookingPage.tsx
│   │   ├── StepSelectService.tsx
│   │   ├── StepSelectBarber.tsx
│   │   ├── StepSelectDateTime.tsx
│   │   ├── StepClientInfo.tsx
│   │   └── StepSuccess.tsx
│   └── super/
│       └── SuperTenantsPage.tsx
├── stores/
│   └── authStore.ts      # Zustand: accessToken, refreshToken, user
├── types/
│   └── index.ts          # todos os tipos TypeScript
├── App.tsx
└── main.tsx
```

---

## Roles

| Role          | Acesso                                             |
| ------------- | -------------------------------------------------- |
| `SUPER_ADMIN` | `/super/tenants` + painel admin completo           |
| `OWNER`       | Painel admin completo (todas as rotas `/admin/*`)  |
| `BARBER`      | Dashboard e agenda (somente leitura/ações básicas) |
