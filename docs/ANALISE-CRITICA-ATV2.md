# Análise Crítica e Refatoração — ATV2 CineBridge Recommendation

**Disciplina:** Técnicas de Programação II  
**Atividade:** ATVII — Qualidade estrutural e padrões criacionais  
**Professor:** Dr. Eng. Gerson Penha  
**Plataforma:** CineBridge — microsserviço de recomendação

---

## 1. Contexto

Após a primeira atividade (Strategy, Template Method, Observer e Visitor), o microsserviço operava com um **modelo único de projeto e profissional**, com atributos e papéis relativamente fixos. A expansão do negócio — documentários, animações, publicitário/agências — tornou a criação de novos tipos de projeto **repetitiva e propensa a erros**, com risco de espalhar condicionais (`if tipo === ...`) pelo orquestrador e pelo serviço.

Esta análise identifica sintomas clássicos de projeto inadequado e descreve como **Prototype**, **Factory Method** e **Abstract Factory** os mitigam.

---

## 2. Sintomas no código anterior à ATV2

### 2.1 Rigidez

**Definição:** qualquer alteração exige modificar múltiplos pontos do código.

**Onde aparecia:**

- Criação de instâncias de projeto com atributos “na mão” em vários fluxos (serviço, testes, seeds).
- Escolha de estratégia de recomendação centralizada em `createStrategy()` no `RecommendationService`, mas **sem** uma família coerente de objetos (validador + notificador) ligada ao tipo de projeto.
- Inclusão de um novo gênero (ex.: publicitário, VR) exigiria tocar em:
  - montagem do objeto `Projeto`;
  - regras de validação ad hoc;
  - possivelmente o orquestrador ou o serviço com novos `switch/case`.

**Impacto:** curva de esforço crescente a cada novo tipo de produção audiovisual.

### 2.2 Fragilidade

**Definição:** correção em um ponto introduz erros em partes distintas.

**Onde aparecia:**

- Validação genérica (orçamento, data, papéis) misturada ao Template Method, sem regras específicas por domínio (pesquisa de campo em documentário, pipeline 3D em animação, motion design em publicitário).
- Notificações e auditoria acopladas ao fluxo global, sem garantia de que o “ecossistema” (projeto + validador + recomendador + notificador) fosse **consistente** para o mesmo tipo.
- Duplicação implícita de lógica de criação: mudar um default de papéis em um lugar e esquecer em outro.

**Impacto:** regressões difíceis de prever ao evoluir um tipo de projeto.

### 2.3 Imobilidade

**Definição:** componentes tão emaranhados que não podem ser reutilizados em outros contextos.

**Onde aparecia:**

- Não havia **modelos pré-configurados** reutilizáveis (protótipos) para cadastro rápido de projetos.
- Não havia abstração de “fábrica de família de objetos” reutilizável pelo orquestrador.
- O orquestrador conhecia apenas a Strategy; não havia ponto único para obter validador/notificador alinhados ao tipo — o que dificultava reutilizar o mesmo fluxo em outros clientes (API, jobs, CLI).

**Impacto:** reinventar a montagem do ecossistema a cada novo canal de entrada.

### 2.4 Dívida técnica e risco de negócio

Esses sintomas traduzem-se em:

- mais tempo por feature;
- onboarding mais difícil;
- maior chance de inconsistência entre tipos de projeto na plataforma CineBridge;
- custo de manutenção que cresce com a diversidade de produções (documentário, animação, publicitário, futuros formatos).

---

## 3. Solução aplicada: padrões criacionais

### 3.1 Prototype

**Problema atacado:** criação repetitiva e acoplamento a classes concretas na hora de instanciar projetos complexos.

**Solução:**

- Hierarquia `ProjetoBase` / `ProjetoDocumentario` / `ProjetoAnimacao` / `ProjetoPublicitario`.
- Método `clone()` com **cópia profunda** de papéis e restrições específicas.
- `RegistroPrototipos`: modelos pré-configurados (`documentario`, `animacao`, `publicitario`) clonáveis com overrides.

**Benefício:** cadastro acelerado, menos duplicação, protótipos evoluem em um único lugar.

### 3.2 Factory Method (via fábricas concretas)

**Problema atacado:** cada tipo de projeto precisa fabricar seus componentes de forma especializada.

**Solução:**

- Cada fábrica concreta implementa métodos de criação:
  - `criarProjeto()`
  - `criarValidador()`
  - `criarRecomendador()`
  - `criarNotificador()`

Assim, a **decisão de *como* criar** fica encapsulada na fábrica do tipo (equivalente conceitual ao “subtipo define a fabricação dos componentes” descrito no enunciado).

**Benefício:** extensão por novas fábricas sem reescrever o núcleo.

### 3.3 Abstract Factory

**Problema atacado:** garantir que a **família** de objetos de um mesmo tipo coopere (projeto + validador + recomendador + notificador).

**Solução:**

- Interface `FabricaProjeto`.
- `FabricaDocumentario`, `FabricaAnimacao`, `FabricaPublicitario`.
- `SeletorFabrica` para obter a fábrica pelo tipo **sem condicionais no orquestrador**.

**Benefício:** ao trocar o tipo de projeto, todo o ecossistema se adapta; adicionar “realidade virtual” = nova fábrica concreta, núcleo intacto.

### 3.4 Integração com padrões já existentes (ATV1)

| Padrão ATV1        | Papel após ATV2                                      |
|--------------------|------------------------------------------------------|
| Strategy           | Fornecido por `criarRecomendador()` da fábrica       |
| Template Method    | Orquestrador inalterado em estrutura; recebe fábrica |
| Observer           | Fornecido por `criarNotificador()`                  |
| Visitor            | Mantido (consistency/compatibility/report) + validadores tipados |

---

## 4. Mapeamento requisito PDF → implementação

| Tarefa do enunciado | Onde está |
|---------------------|-----------|
| Prototype na hierarquia de Projeto + `clonar` profundo | `src/prototypes/projeto.prototype.ts` |
| Interface `FabricaProjeto` + 3 fábricas | `src/factories/fabrica.projeto.ts` |
| Orquestrador recebe `FabricaProjeto` | `src/template/team-composition.orchestrator.ts` |
| Sistema de recomendação seleciona fábrica | `src/services/recommendation.service.ts` |
| Testes de integração alternando fábricas | `tests/factories.integration.test.ts` |
| Compatibilidade Win10+ / Ubuntu 24.04+ | Node.js + Docker (ver README) |

---

## 5. Resultado estrutural

Após a refatoração:

- **Menos rigidez:** novo tipo = nova fábrica + protótipo, sem espalhar `if` no orquestrador.
- **Menos fragilidade:** validador e notificador nascem com o mesmo tipo do projeto.
- **Menos imobilidade:** protótipos e fábricas são reutilizáveis por API, testes e futuros módulos.
- **Testes:** 19 testes de integração/unidade dos padrões criacionais demonstram troca de fábrica sem alterar o orquestrador.

A qualidade estrutural deixa de ser apenas “código que funciona” e passa a ser base para o empreendimento evoluir com agilidade e menor risco tecnológico — alinhado ao objetivo pedagógico da ATVII.
