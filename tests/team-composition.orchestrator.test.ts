import { describe, expect, it, vi } from 'vitest';

import {
DefaultTeamCompositionOrchestrator
} from '../src/template/team-composition.orchestrator';

import {
Projeto,
Profissional,
Recomendacao
} from '../src/domain/entities';

import {
RecommendationStrategy
} from '../src/strategies/recommendation.strategy';

describe('TeamCompositionOrchestrator', () => {
const professionals: Profissional[] = [
{
id: 'p1',
nome: 'Ana Silva',
especialidades: ['roteirista'],
precoMedio: 5000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.8, 0.7],
competencias: [],
historico: [],
avaliacoes: []
},
{
id: 'p2',
nome: 'Carlos Mendes',
especialidades: ['diretor'],
precoMedio: 6000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.9, 0.7],
competencias: [],
historico: [],
avaliacoes: []
}
];

const createProject = (
overrides: Partial<Projeto> = {}
): Projeto => ({
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 20000,
dataEntrega: '2099-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'Diretor',
peso: 0.9
},
{
papel: 'Roteirista',
peso: 0.8
}
],
estrategia: 'cosine',
...overrides
});

const createStrategy = (
recommendations: Recomendacao[]
): RecommendationStrategy => ({
recommend: vi.fn(
(
_project: Projeto,
_professionals: Profissional[]
) => recommendations
)
});

it('deve normalizar gênero, localização e papéis antes de executar a estratégia', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

const project =
  createProject({
    genero: '  DRAMA  ',
    localizacao: '  SÃO PAULO  ',
    papeis: [
      {
        papel: '  DIRETOR  ',
        peso: 0.9
      }
    ]
  });

orchestrator.compose(
  project,
  professionals
);

expect(
  strategy.recommend
).toHaveBeenCalledTimes(1);

const normalizedProject =
  vi.mocked(
    strategy.recommend
  ).mock.calls[0][0];

expect(
  normalizedProject.genero
).toBe('drama');

expect(
  normalizedProject.localizacao
).toBe('são paulo');

expect(
  normalizedProject.papeis[0].papel
).toBe('diretor');

});

it('deve executar a estratégia de recomendação', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
},
{
papel: 'roteirista',
profissional: professionals[0],
score: 0.8,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

const result =
  orchestrator.compose(
    createProject(),
    professionals
  );

expect(
  strategy.recommend
).toHaveBeenCalledTimes(1);

expect(
  result.recomendacoes
).toHaveLength(2);

});

it('deve selecionar apenas a melhor recomendação de cada papel', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[0],
score: 0.6,
motivo: 'Menor score'
},
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Maior score'
},
{
papel: 'roteirista',
profissional: professionals[0],
score: 0.8,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

const result =
  orchestrator.compose(
    createProject(),
    professionals
  );

expect(
  result.recomendacoes
).toHaveLength(2);

const diretor =
  result.recomendacoes.find(
    (recommendation) =>
      recommendation.papel === 'diretor'
  );

expect(diretor).toBeDefined();

expect(
  diretor!.profissional.id
).toBe('p2');

expect(
  diretor!.score
).toBe(0.9);

});

it('deve calcular o orçamento estimado da equipe', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
},
{
papel: 'roteirista',
profissional: professionals[0],
score: 0.8,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

const result =
  orchestrator.compose(
    createProject(),
    professionals
  );

expect(
  result.orcamentoEstimado
).toBe(11000);

});

it('deve calcular o score geral da equipe', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
},
{
papel: 'roteirista',
profissional: professionals[0],
score: 0.7,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

const result =
  orchestrator.compose(
    createProject(),
    professionals
  );

expect(
  result.scoreGeral
).toBe(0.8);

});

it('deve retornar o ID do projeto na equipe sugerida', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
},
{
papel: 'roteirista',
profissional: professionals[0],
score: 0.8,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

const result =
  orchestrator.compose(
    createProject({
      id: 'projeto-123'
    }),
    professionals
  );

expect(
  result.projetoId
).toBe('projeto-123');

});

it('deve rejeitar orçamento igual ou menor que zero', () => {
const strategy =
createStrategy([]);

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

expect(() =>
  orchestrator.compose(
    createProject({
      orcamentoTotal: 0
    }),
    professionals
  )
).toThrow(
  'Orçamento deve ser positivo.'
);

});

it('deve rejeitar quando não existem profissionais disponíveis', () => {
const strategy =
createStrategy([]);

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

expect(() =>
  orchestrator.compose(
    createProject(),
    []
  )
).toThrow(
  'Nenhum profissional disponível para avaliação.'
);

});

it('deve rejeitar uma data de entrega inválida', () => {
const strategy =
createStrategy([]);

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

expect(() =>
  orchestrator.compose(
    createProject({
      dataEntrega: 'data-invalida'
    }),
    professionals
  )
).toThrow(
  'Data de entrega inválida.'
);

});

it('deve rejeitar uma data de entrega que já passou', () => {
const strategy =
createStrategy([]);

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

expect(() =>
  orchestrator.compose(
    createProject({
      dataEntrega: '2020-01-01'
    }),
    professionals
  )
).toThrow(
  'Data de entrega já passou.'
);

});

it('deve rejeitar quando algum papel obrigatório não pode ser preenchido', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

expect(() =>
  orchestrator.compose(
    createProject(),
    professionals
  )
).toThrow(
  'Não foi possível preencher os papéis: roteirista.'
);

});

it('deve rejeitar quando o custo da equipe ultrapassa o orçamento', () => {
const recommendations: Recomendacao[] = [
{
papel: 'diretor',
profissional: professionals[1],
score: 0.9,
motivo: 'Boa compatibilidade'
},
{
papel: 'roteirista',
profissional: professionals[0],
score: 0.8,
motivo: 'Boa compatibilidade'
}
];

const strategy =
  createStrategy(
    recommendations
  );

const orchestrator =
  new DefaultTeamCompositionOrchestrator(
    strategy
  );

expect(() =>
  orchestrator.compose(
    createProject({
      orcamentoTotal: 10000
    }),
    professionals
  )
).toThrow(
  'A equipe estimada (11000.00) ultrapassa o orçamento do projeto (10000.00).'
);

});
});
