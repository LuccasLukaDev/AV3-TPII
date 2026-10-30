# Cinebridge Recommendation – ATVIII (Adapter, Composite, Decorator)

## O que foi alterado

Implementação dos padrões estruturais **Adapter**, **Composite** e **Decorator** sobre o microsserviço de recomendação existente, conforme especificação da Atividade Prática ATVIII.

### 1. Padrão Adapter

**Novos arquivos:**
- `src/adapters/adaptador.interfaces.ts` – interfaces `AdaptadorArmazenamento`, `AdaptadorPagamento`, `AdaptadorProfissional`
- `src/adapters/sistemas-externos.ts` – sistemas simulados (S3, Google Cloud Storage, Stripe, PagSeguro, LinkedIn, Cadastro Interno)
- `src/adapters/adaptador.armazenamento.ts` – `AdaptadorS3`, `AdaptadorGoogleCloud`
- `src/adapters/adaptador.pagamento.ts` – `AdaptadorStripe`, `AdaptadorPagSeguro`
- `src/adapters/adaptador.profissional.ts` – `AdaptadorLinkedIn`, `AdaptadorInterno`
- `src/adapters/index.ts` – reexportações

**Alterações em `RecommendationService` (SistemaRecomendacao):**
- Construtor aceita opcionalmente as três instâncias de adaptadores
- Métodos `configurarAdaptadores`, `getAdaptador*`, `uploadMidia`, `processarPagamento`, `buscarProfissionaisExternos`
- A lógica de negócio não depende de implementações concretas dos provedores externos

### 2. Padrão Composite

**Novos arquivos:**
- `src/composite/servico-projeto.ts` – interface `ServicoProjeto` (`calcularCusto`, `listarSubservicos`, `obterPrazo`, `validar`, `obterNome`, `obterPapel`), classes `ServicoAtomico` e `PacoteServico`

**Alterações:**
- `src/domain/entities.ts` – `Projeto` passou a ter o atributo opcional `servicoPrincipal?: ServicoProjeto` (mantém `papeis` para compatibilidade)
- `RecommendationService` – métodos `calcularCustoTotalProjeto`, `validarServicosProjeto`, `obterPrazoProjeto` que delegam recursivamente ao composite quando presente

### 3. Padrão Decorator

**Novos arquivos:**
- `src/decorators/recomendacao.decorators.ts` – `CacheDecorator`, `AuditoriaDecorator`, `CompressaoDecorator` e helper `criarPilhaDecoradores`

**Alterações em `RecommendationService`:**
- `configurarDecoradores` e `aplicarDecoradores`
- As estratégias geradas pelas fábricas são automaticamente envolvidas pela pilha de decoradores configurada (cache e auditoria por padrão; compressão opcional)
- Combinação dinâmica em tempo de execução sem modificar `SistemaRecomendacao` nem o recomendador base

### 4. Testes de integração

- `tests/adapter.pattern.test.ts` – troca de provedores de armazenamento/pagamento/profissionais sem alterar a lógica de negócio
- `tests/composite.pattern.test.ts` – cálculo de custos/prazos e validação em hierarquias de diferentes profundidades
- `tests/decorator.pattern.test.ts` – cache reduz recomputações, auditoria registra chamadas, compressão gera métricas, pilha de decoradores em qualquer ordem

### 5. Compatibilidade

O código permanece em TypeScript puro (Node.js), compatível com:
- Windows 10 ou superior
- Linux Ubuntu 24.04.3 ou superior e distribuições derivadas

Nenhum comentário foi adicionado ao código-fonte conforme solicitado.

## Como executar os novos testes

```bash
npm install
npx vitest run tests/adapter.pattern.test.ts tests/composite.pattern.test.ts tests/decorator.pattern.test.ts
```

## Estrutura adicionada

```
src/
  adapters/
    adaptador.interfaces.ts
    adaptador.armazenamento.ts
    adaptador.pagamento.ts
    adaptador.profissional.ts
    sistemas-externos.ts
    index.ts
  composite/
    servico-projeto.ts
  decorators/
    recomendacao.decorators.ts
tests/
  adapter.pattern.test.ts
  composite.pattern.test.ts
  decorator.pattern.test.ts
```
