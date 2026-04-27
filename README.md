# ConectaServ

Plataforma para recomendacao de prestadores de servico em comunidades.

## Pre-requisitos

- Node.js (v18+)
- PostgreSQL 14
- npm

## Estrutura

```
backend/   → API Express + Prisma ORM
frontend/  → React + Vite + Tailwind CSS
```

## Banco de Dados

Iniciar o PostgreSQL:

```bash
brew services start postgresql@14
```

## Backend

```bash
cd backend
npm install
```

Criar o arquivo `.env` na raiz do `backend/`:

```
DATABASE_URL="postgresql://SEU_USUARIO@localhost:5432/conectaserv"
PORT=3000
JWT_SECRET=secret
JWT_REFRESH_SECRET=refresh
```

Rodar as migrations para criar as tabelas:

```bash
npx prisma migrate dev
```

Popular o banco com dados de teste (200 usuarios, 50 prestadores, 20 grupos, 500 reviews, 300 recomendacoes — senha padrao: `123456`):

```bash
npx prisma db seed
```

Visualizar o banco no navegador:

```bash
npx prisma studio
```

Abre em `http://localhost:5555`.

Iniciar a API:

```bash
npm run dev
```

API disponivel em `http://localhost:3000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Testes

```bash
cd backend
npm test
```
