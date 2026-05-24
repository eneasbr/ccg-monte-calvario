# CCG Monte Calvário — Founding Partners

Plataforma de arrecadação para a campanha de construção da CCG Monte Calvário.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (banco de dados + autenticação)
- **Vercel** (deploy)

---

## Estrutura de pastas

```
ccg-monte-calvario/
├── app/
│   ├── page.tsx                    ← dashboard público
│   ├── layout.tsx                  ← layout global
│   ├── globals.css                 ← estilos globais
│   └── admin/
│       ├── page.tsx                ← login admin
│       └── dashboard/
│           ├── layout.tsx          ← proteção de rota
│           └── page.tsx            ← painel admin completo
├── lib/
│   ├── supabase.ts                 ← cliente Supabase
│   ├── types.ts                    ← tipos TypeScript
│   └── data.ts                     ← funções de dados
├── public/
│   ├── flags/                      ← bandeiras PT/EN/ES
│   │   ├── pt.svg
│   │   ├── en.svg
│   │   └── es.svg
│   └── img/
│       └── logo-ccg.png            ← logo da igreja
├── middleware.ts                   ← proteção de rotas
├── schema.sql                      ← schema do banco
├── .env.example                    ← variáveis de ambiente
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Setup — passo a passo

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### 3. Criar banco de dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor**
3. Cole o conteúdo de `schema.sql` e execute

### 4. Adicionar arquivos estáticos

Copie para `/public`:
```
public/
├── flags/pt.svg
├── flags/en.svg
├── flags/es.svg
└── img/logo-ccg.png
```

### 5. Rodar localmente

```bash
npm run dev
```

Acesse:
- Dashboard público: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

---

## Cadastrar admins

1. Acesse o painel do Supabase
2. Vá em **Authentication → Users → Invite user**
3. Digite o email do administrador
4. O usuário receberá um email para criar a senha

---

## Deploy na Vercel

1. Suba o projeto no GitHub
2. Conecte o repositório na Vercel
3. Adicione as variáveis de ambiente nas configurações da Vercel
4. Deploy automático a cada push no `main`

---

## URLs

| Ambiente | URL |
|---|---|
| Local público | `http://localhost:3000` |
| Local admin | `http://localhost:3000/admin` |
| Produção público | `https://seu-dominio.com.br` |
| Produção admin | `https://seu-dominio.com.br/admin` |
