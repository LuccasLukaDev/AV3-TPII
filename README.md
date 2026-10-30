# CineBridge Recommendation

API de recomendação de profissionais para projetos audiovisuais, desenvolvida em **TypeScript**, utilizando **Fastify**, **Prisma ORM** e **PostgreSQL**.

O sistema recebe as características de um projeto e seus papéis obrigatórios e retorna uma equipe recomendada de profissionais utilizando diferentes estratégias de recomendação, como **similaridade de cosseno**.

Além da recomendação, a API possui um fluxo de **convites e formação da equipe**, permitindo que o produtor aceite ou rejeite profissionais recomendados e que os profissionais aceitem ou recusem os convites.

---

## Tecnologias

* Node.js 24+
* TypeScript
* Fastify
* Prisma ORM
* PostgreSQL 17
* Docker
* Docker Compose
* Zod
* tsx

---

# Pré-requisitos

Para executar o projeto, é necessário ter instalado:

* **Git**
* **Docker Desktop**

O **Node.js não precisa ser instalado manualmente** caso a aplicação seja executada pelos containers Docker.

O Docker utiliza:

* `node:24` para executar a API
* `postgres:17` para executar o banco de dados

---

# Instalação

## 1. Instalar o Docker Desktop

Baixe e instale o Docker Desktop:

https://www.docker.com/products/docker-desktop/

Depois da instalação, abra o Docker Desktop e aguarde até que ele esteja funcionando.

Para verificar a instalação:

```bash
docker --version
docker compose version
```

---

## 2. Clonar o projeto

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd cinebridge-recommendation
```

---

## 3. Configurar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado:

```text
.env
```

Adicione a URL de conexão com o PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/cinebridge?schema=public"
```

Esse arquivo é utilizado pelo Prisma para acessar o banco PostgreSQL.

> **Atenção:** o arquivo `.env` não deve ser enviado para o GitHub.

---

## 4. Instalar as dependências

Instale as dependências do projeto:

```bash
npm install
```

Esse comando é necessário para executar comandos locais do projeto, como Prisma, seed e desenvolvimento.

---

## 5. Iniciar os containers

Com o Docker Desktop aberto, execute:

```bash
docker compose up -d --build
```

Na primeira execução, o Docker fará automaticamente o download das imagens necessárias caso elas ainda não estejam disponíveis no computador.

O projeto utiliza:

```text
postgres:17
node:24
```

A imagem do PostgreSQL é utilizada para executar o banco de dados.

A imagem do Node.js é utilizada pelo `Dockerfile` para construir o container da API.

**Não é necessário baixar essas imagens manualmente.**

Depois da execução, serão criados dois containers:

```text
cinebridge-postgres
cinebridge-api
```

---

# Configuração do banco de dados

## 6. Executar as migrations

Com o PostgreSQL em execução, execute:

```bash
npx prisma migrate dev
```

Esse comando cria e/ou atualiza as tabelas do banco de dados de acordo com:

```text
prisma/schema.prisma
```

As migrations ficam armazenadas em:

```text
prisma/migrations/
```

---

## 7. Gerar o Prisma Client

Execute:

```bash
npx prisma generate
```

Esse comando gera o Prisma Client utilizado pela aplicação para acessar o banco PostgreSQL.

---

## 8. Popular o banco de dados

O projeto possui um arquivo de seed com dados de exemplo.

Execute:

```bash
npm run prisma:seed
```

Se tudo estiver correto, será exibido:

```text
Seed concluído com sucesso!
```

O seed adiciona profissionais de exemplo, como:

* Ana Silva
* Carlos Mendes
* Juliana Costa
* Roberto Lima
* Fernanda Oliveira

> **Atenção:** o seed limpa os dados existentes nas tabelas utilizadas antes de inserir os dados novamente. Não execute o seed em um banco que contenha dados que você deseja preservar.

---

# Executando a API

## 9. Verificar os containers

Execute:

```bash
docker compose ps
```

Os containers devem aparecer em execução.

A configuração do projeto utiliza:

| Serviço    | Container             |  Porta |
| ---------- | --------------------- | -----: |
| PostgreSQL | `cinebridge-postgres` | `5432` |
| API        | `cinebridge-api`      | `3000` |

---

## 10. Verificar a API

Com os containers em execução, a API estará disponível em:

```text
http://localhost:3000
```

### Health Check

Utilize:

```http
GET http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "cinebridge-recommendation"
}
```

---

# Recomendação de profissionais

## 11. Gerar recomendações

A principal rota da aplicação é:

```http
POST http://localhost:3000/recommend
```

Você pode utilizar:

* Thunder Client
* Postman
* Insomnia
* Outra ferramenta capaz de realizar requisições HTTP

### JSON de exemplo

```json
{
  "id": "proj-2026-001",
  "genero": "Drama",
  "duracaoEstimada": 90,
  "orcamentoTotal": 35000,
  "dataEntrega": "2026-12-15",
  "tipoCaptacao": "ficcao",
  "localizacao": "São Paulo",
  "papeis": [
    {
      "papel": "diretor",
      "peso": 0.9
    },
    {
      "papel": "diretor de fotografia",
      "peso": 0.8
    },
    {
      "papel": "editor",
      "peso": 0.7
    },
    {
      "papel": "roteirista",
      "peso": 0.75
    }
  ],
  "estrategia": "cosine"
}
```

A API retorna informações relacionadas à equipe recomendada, consistência, compatibilidade e relatório.

Exemplo simplificado:

```json
{
  "equipe": {
    "projetoId": "proj-2026-001",
    "recomendacoes": [],
    "scoreGeral": 0,
    "orcamentoEstimado": 0
  },
  "consistency": {
    "consistent": false,
    "missingRoles": [],
    "budgetOk": false,
    "totalCost": 0
  },
  "compatibility": {
    "compatibilityScore": 0
  },
  "report": "..."
}
```

Os valores podem variar de acordo com os dados cadastrados e as regras utilizadas pela aplicação.

---

# Fluxo de convites e formação da equipe

Depois que as recomendações são geradas, o produtor pode decidir se deseja convidar um profissional recomendado.

## 12. Aceitar uma recomendação

Utilize:

```http
POST http://localhost:3000/projects/:projectId/recommendations/decision
```

Exemplo:

```json
{
  "papel": "diretor",
  "profissionalId": "p4",
  "decision": "accept"
}
```

Quando a recomendação é aceita, a API cria um convite para o profissional.

---

## 13. Rejeitar uma recomendação

A mesma rota pode ser utilizada para rejeitar uma recomendação:

```json
{
  "papel": "diretor",
  "profissionalId": "p4",
  "decision": "reject"
}
```

Nesse caso, o sistema realiza uma nova recomendação para o papel informado, excluindo o profissional rejeitado.

---

## 14. Responder a um convite

Depois que o convite é criado, o profissional pode aceitar ou rejeitar.

Utilize:

```http
PATCH http://localhost:3000/invites/:invitationId/response
```

### Aceitar

```json
{
  "response": "accept"
}
```

### Rejeitar

```json
{
  "response": "reject"
}
```

Caso o profissional rejeite o convite, o sistema gera uma nova recomendação para o papel correspondente.

---

# Substituição de profissionais

## 15. Substituir um profissional

Também é possível solicitar diretamente a substituição de um profissional:

```http
POST http://localhost:3000/projects/:projectId/replace
```

Exemplo:

```json
{
  "papel": "editor",
  "profissionalId": "p5"
}
```

O sistema gera uma nova recomendação para o papel informado, evitando o profissional que foi substituído.

---

# Consultas da equipe

## 16. Consultar os convites

Para consultar os convites de um projeto:

```http
GET http://localhost:3000/projects/:projectId/invites
```

Exemplo:

```http
GET http://localhost:3000/projects/proj-2026-001/invites
```

---

## 17. Consultar a equipe final

Depois que todos os profissionais necessários aceitarem seus convites:

```http
GET http://localhost:3000/projects/:projectId/team
```

Exemplo:

```http
GET http://localhost:3000/projects/proj-2026-001/team
```

A equipe será considerada finalizada quando todos os papéis obrigatórios do projeto possuírem um profissional com convite aceito.

---

# Auditoria e notificações

O sistema utiliza o padrão **Observer** para reagir aos eventos importantes da aplicação.

Entre os eventos registrados estão:

* `recommendation_generated`
* `professional_invited`
* `recommendation_rejected`
* `professional_accepted_invitation`
* `professional_rejected_invitation`
* `team_finalized`

Para consultar os registros de auditoria:

```http
GET http://localhost:3000/audit
```

Os eventos são processados pelos observers configurados na aplicação.

Atualmente, o projeto possui observers relacionados a:

* Auditoria
* Notificações por e-mail

---

# Prisma Studio

Para visualizar os dados do banco através de uma interface gráfica, execute:

```bash
npx prisma studio
```

O Prisma Studio permite consultar e visualizar os registros armazenados nas tabelas do PostgreSQL.

---

# Comandos Docker

## Iniciar os containers

Na primeira execução:

```bash
docker compose up -d --build
```

Nas próximas execuções:

```bash
docker compose up -d
```

## Verificar os containers

```bash
docker compose ps
```

## Ver os logs

Todos os serviços:

```bash
docker compose logs -f
```

Somente a API:

```bash
docker compose logs -f api
```

Somente o PostgreSQL:

```bash
docker compose logs -f postgres
```

## Parar os containers

```bash
docker compose down
```

> Esse comando para e remove os containers, mas o volume do PostgreSQL continua armazenado.

## Parar os containers e remover os dados

```bash
docker compose down -v
```

> **Atenção:** o parâmetro `-v` remove o volume do PostgreSQL e, consequentemente, os dados armazenados no banco.

---

# Comandos do projeto

| Comando                  | Descrição                           |
| ------------------------ | ----------------------------------- |
| `npm install`            | Instala as dependências             |
| `npm run dev`            | Executa a API em desenvolvimento    |
| `npm run start`          | Executa a API                       |
| `npm run build`          | Compila o TypeScript                |
| `npx prisma migrate dev` | Executa as migrations               |
| `npx prisma generate`    | Gera o Prisma Client                |
| `npm run prisma:seed`    | Popula o banco com dados de exemplo |
| `npx prisma studio`      | Abre o Prisma Studio                |

---

# Estrutura do projeto

```text
cinebridge-recommendation/
│
├── prisma/
│   ├── migrations/
│   │   ├── migration_lock.toml
│   │   └── 20260915185640_init/
│   │       └── migration.sql
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── controllers/
│   │   └── recommendation.controller.ts
│   │
│   ├── database/
│   │   └── prisma.ts
│   │
│   ├── domain/
│   │   ├── entities.ts
│   │   └── interfaces.ts
│   │
│   ├── observers/
│   │   ├── audit.observer.ts
│   │   ├── email.observer.ts
│   │   ├── notification.subject.ts
│   │   └── observer.ts
│   │
│   ├── repositories/
│   │   ├── invitation.repository.ts
│   │   ├── professional.repository.ts
│   │   └── project.repository.ts
│   │
│   ├── services/
│   │   ├── recommendation.service.ts
│   │   └── team.service.ts
│   │
│   ├── strategies/
│   │   ├── colaborative.strategy.ts
│   │   ├── cosine.strategy.ts
│   │   ├── low-budget.strategy.ts
│   │   └── recommendation.strategy.ts
│   │
│   ├── template/
│   │   └── team-composition.orchestrator.ts
│   │
│   └── visitors/
│       ├── compatibility.visitor.ts
│       ├── consistency.visitor.ts
│       ├── report.visitor.ts
│       └── visitor.ts
│
├── app.ts
├── server.ts
├── prisma.config.ts
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── package.json
├── tsconfig.json
├── .env
├── ajustes.txt
└── README.md
```

---

# Banco de dados

O projeto utiliza **PostgreSQL 17** como banco de dados e **Prisma ORM** para realizar o acesso aos dados.

Os principais modelos definidos no `prisma/schema.prisma` são:

* `Profissional`
* `Disponibilidade`
* `Competencia`
* `Avaliacao`
* `Projeto`
* `PapelObrigatorio`
* `Recomendacao`
* `Convite`

## Fluxo de acesso aos profissionais

```text
API
 ↓
Controller
 ↓
RecommendationService
 ↓
Strategy
 ↓
ProfessionalRepository
 ↓
Prisma Client
 ↓
PostgreSQL
```

---

# Padrões de projeto utilizados

O projeto utiliza diferentes padrões para organizar a lógica da aplicação.

## Strategy

Utilizado para permitir diferentes estratégias de recomendação.

Estratégias disponíveis:

* **Cosine Similarity**
* **Collaborative Filtering**
* **Low Budget Rules**

Arquivos relacionados:

```text
src/strategies/
├── recommendation.strategy.ts
├── cosine.strategy.ts
├── colaborative.strategy.ts
└── low-budget.strategy.ts
```

---

## Template Method

Utilizado na composição da equipe para definir um fluxo comum de processamento.

Fluxo geral:

```text
Normalização
     ↓
Validação
     ↓
Aplicação da estratégia
     ↓
Pós-processamento
     ↓
Equipe recomendada
```

Implementação:

```text
src/template/
└── team-composition.orchestrator.ts
```

---

## Observer

Utilizado para reagir aos eventos da aplicação.

Fluxo:

```text
Evento da aplicação
        ↓
NotificationSubject
        ↓
Observers
   ├── Email
   └── Auditoria
```

Implementação:

```text
src/observers/
├── audit.observer.ts
├── email.observer.ts
├── notification.subject.ts
└── observer.ts
```

---

## Visitor

Utilizado para realizar diferentes análises sobre o projeto e os profissionais recomendados.

Visitors implementados:

* **Consistency Visitor**
* **Compatibility Visitor**
* **Report Visitor**

Implementação:

```text
src/visitors/
├── compatibility.visitor.ts
├── consistency.visitor.ts
├── report.visitor.ts
└── visitor.ts
```

---

## Repository

Utilizado para separar o acesso aos dados da lógica de negócio.

Repositories:

```text
src/repositories/
├── invitation.repository.ts
├── professional.repository.ts
└── project.repository.ts
```

---

# Docker e banco de dados

O `docker-compose.yml` cria dois serviços principais.

## PostgreSQL

Container:

```text
cinebridge-postgres
```

Imagem:

```text
postgres:17
```

Banco:

```text
cinebridge
```

Usuário:

```text
postgres
```

Porta:

```text
5432
```

## API

Container:

```text
cinebridge-api
```

Imagem base:

```text
node:24
```

Porta:

```text
3000
```

---

# Solução de problemas

## Docker não inicia

Verifique se o Docker Desktop está aberto.

Depois execute:

```bash
docker compose ps
```

Se necessário, visualize os logs:

```bash
docker compose logs
```

---

## PostgreSQL não conecta

Verifique se o container está executando:

```bash
docker compose ps
```

Confira também o arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/cinebridge?schema=public"
```

---

## Erro ao executar o Prisma

Verifique se as dependências estão instaladas:

```bash
npm install
```

Depois tente:

```bash
npx prisma generate
```

Se necessário, execute novamente as migrations:

```bash
npx prisma migrate dev
```

---

## Seed não funciona

Verifique se:

1. O Docker Desktop está funcionando.
2. O container PostgreSQL está em execução.
3. O arquivo `.env` existe.
4. O `DATABASE_URL` está correto.
5. As migrations foram executadas.
6. O Prisma Client foi gerado.

Depois execute:

```bash
npm run prisma:seed
```

---

## Porta 3000 ocupada

Se a porta `3000` estiver sendo utilizada por outro programa, será necessário liberar a porta ou alterar a configuração da aplicação.

---

# Execução rápida

Depois de clonar o projeto e instalar o Docker Desktop:

```bash
git clone <URL_DO_REPOSITORIO>

cd cinebridge-recommendation

npm install

docker compose up -d --build

npx prisma migrate dev

npx prisma generate

npm run prisma:seed
```

Depois disso, teste o Health Check:

```http
GET http://localhost:3000/health
```

E faça uma requisição:

```http
POST http://localhost:3000/recommend
```

utilizando o JSON de exemplo apresentado neste README.

---

# ATV2 — Padrões criacionais (Prototype, Factory Method, Abstract Factory)

Esta versão incorpora a segunda atividade prática: refatoração estrutural do microsserviço para suportar **múltiplos tipos de projeto** (documentário, animação, publicitário) sem condicionais no orquestrador.

## Documentação da entrega

| Documento | Conteúdo |
|-----------|----------|
| `docs/ANALISE-CRITICA-ATV2.md` | Análise de **rigidez, fragilidade e imobilidade** no código anterior e como os padrões resolvem |
| `docs/diagrama-classes-atv2.puml` | Diagrama de classes (PlantUML) da arquitetura ATV2 |
| `ATV2-PADROES.md` | Resumo técnico dos arquivos e benefícios |

Para visualizar o diagrama PlantUML: [plantuml.com/plantuml](https://www.plantuml.com/plantuml) ou extensão PlantUML no VS Code / IntelliJ.

## Padrões ATV2 (resumo)

* **Prototype** — `src/prototypes/projeto.prototype.ts` (`clone()` profundo + registro de protótipos)
* **Abstract Factory / Factory Method** — `src/factories/fabrica.projeto.ts` (família: projeto + validador + recomendador + notificador)
* **Validadores por tipo** — `src/validators/project.validators.ts`
* **Orquestrador** — recebe `FabricaProjeto` (`src/template/team-composition.orchestrator.ts`)
* **Serviço** — seleciona a fábrica pelo tipo (`src/services/recommendation.service.ts`)

## Testes da ATV2

```bash
npm install
npx prisma generate
npm test -- tests/factories.integration.test.ts
```

Esperado: **19 testes passando** (Prototype, fábricas, integração com orquestrador sem alterar código do template method).

## Compatibilidade de plataformas (requisito comercial)

O sistema é compatível com:

* **Windows 10 ou superior**
* **Linux Ubuntu 24.04.03 ou superior** e distribuições derivadas do Ubuntu

Via **Node.js 24+** e/ou **Docker** (`node:24` + `postgres:17`), conforme descrito na instalação.

---

# Licença

Projeto desenvolvido para fins acadêmicos.
