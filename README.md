# ConectaServ

> Plataforma web de recomendação de prestadores de serviço em **grupos de confiança**, com **resumo de avaliações gerado por Inteligência Artificial**.

Trabalho de Conclusão de Curso do curso de **Análise e Desenvolvimento de Sistemas** da **FATEC SENAC Pelotas**.

O ConectaServ organiza a troca de recomendações que hoje se perde em grupos de WhatsApp e Facebook de bairro ou condomínio. Em vez de indicações que somem no histórico, o conhecimento coletivo do grupo fica estruturado, pesquisável e contextualizado — com avaliações persistentes e um resumo das opiniões gerado automaticamente por um modelo de linguagem.

---

## 🔗 Demonstração online

|                                   | Link                                              |
| --------------------------------- | ------------------------------------------------- |
| **Aplicação**                     | https://conectaserv.onrender.com                  |
| **API**                           | https://conectaserv-api.onrender.com              |
| **Documentação da API (Swagger)** | ver pasta [`swagger-api-docs/`](swagger-api-docs) |

### Credenciais de teste

O banco de demonstração já vem populado (200 usuários, 50 prestadores, grupos, avaliações e recomendações). Todos os usuários do seed usam a mesma senha:

| E-mail                              | Senha    |
| ----------------------------------- | -------- |
| `lazaro.pereira.provider@email.com` | `123456` |
| `lazaro.pereira.user@email.com`     | `123456` |

> ℹ️ A hospedagem usa o plano gratuito do Render. A **primeira requisição pode levar ~30 s** enquanto o serviço "acorda"; depois disso responde normalmente.

---

## ✨ Funcionalidades

- **Grupos de confiança** privados, com papéis de administrador e membro, convites e solicitações de entrada com aprovação.
- **Recomendações** de prestadores cadastrados na plataforma **ou** externos (nome, categoria e telefone), com votos e comentários.
- **Pedidos de recomendação** abertos ao grupo, com respostas que combinam texto livre, telefone (link de WhatsApp pré-preenchido) e **autocomplete** de prestador interno.
- **Avaliações** de 1 a 5 estrelas (uma por usuário, editável) com comentário.
- **Resumo de avaliações por IA** — texto curto que condensa os pontos mais citados, **regenerado automaticamente** a cada avaliação criada, editada ou removida.
- **Links de WhatsApp** com mensagem pré-preenchida sempre que um telefone é exibido.
- **Notificações** de eventos relevantes, com contador no cabeçalho.
- **Perfil** com data de nascimento (idade calculada na interface) e foto.
- **Autenticação** JWT com _refresh token_ automático.

## 🛠️ Tecnologias

**Frontend:** React 18 · Vite · Tailwind CSS · React Router · Axios · Lucide · React Hot Toast · Recharts

**Backend:** Node.js · Express 5 · Prisma ORM · PostgreSQL · JWT (+ refresh) · express-validator · bcrypt.js · Helmet · CORS · express-rate-limit · Morgan · Multer

**Inteligência Artificial:** [Claude Agent SDK](https://docs.anthropic.com/en/api/agent-sdk) (`@anthropic-ai/claude-agent-sdk`), modelo `claude-haiku-4-5`, execução assíncrona.

**Testes:** Jest + SuperTest.

---

## 🏗️ Arquitetura

Arquitetura cliente-servidor, com separação clara entre interface, API REST e persistência:

```
frontend/          → React + Vite + Tailwind (SPA)
backend/           → API REST Express + Prisma ORM
  ├─ src/          → controllers, validators, middlewares, rotas
  ├─ prisma/       → schema, migrations e seed
  ├─ scripts/      → utilitários (backfill de resumos de IA)
  └─ tests/        → testes de integração (Jest + SuperTest)
swagger-api-docs/  → documentação da API (Swagger)
docs/              → documentação do projeto (validação, etc.)
```

A camada de IA roda em segundo plano (`setImmediate`): a requisição do usuário que avaliou retorna imediatamente e o resumo é atualizado por trás. O cliente detecta a chegada do novo resumo via _polling_ curto, sem bloquear a interface.

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14
- npm

### 1. Banco de dados

```bash
brew services start postgresql@14
```

### 2. Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na raiz de `backend/`:

```env
DATABASE_URL="postgresql://SEU_USUARIO@localhost:5432/conectaserv"
PORT=3000
JWT_SECRET=secret
JWT_REFRESH_SECRET=refresh
```

Rode as migrations e popule o banco (senha padrão de todos os usuários: `123456`):

```bash
npx prisma migrate dev
npx prisma db seed
```

Inicie a API:

```bash
npm run dev        # http://localhost:3000
```

> Para inspecionar o banco no navegador: `npx prisma studio` (http://localhost:5555).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Por padrão o frontend aponta para `http://localhost:3000`. Para usar outra API, crie um `.env` a partir do [`.env.example`](frontend/.env.example) e defina `VITE_API_URL`.

---

## 🧪 Testes

```bash
cd backend
npm test
```

Suíte de **108 testes de integração** da API (rotas, autenticação e regras de negócio) com Jest + SuperTest.

---

## 📊 Validação com usuários

O sistema foi validado com **10 usuários** por meio de um questionário estruturado combinando o **System Usability Scale (SUS)** e perguntas de percepção de valor:

- **SUS: 95,6 / 100** — classificação "excelente", acima da média de referência (68).
- **100%** dos participantes usariam e recomendariam a plataforma.
- Nenhum erro ou inconsistência relatado.

Instrumento completo em [`docs/validacao-sus.md`](docs/validacao-sus.md).

---

## 👥 Autoria

- **Lázaro Aires Pereira** — desenvolvimento (frontend, backend, integração de IA, banco de dados).
- **Ângelo Gonçalves da Luz** — orientação.

Análise e Desenvolvimento de Sistemas — FATEC SENAC Pelotas.
