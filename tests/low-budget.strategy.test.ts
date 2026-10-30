import { describe, expect, it } from 'vitest';

import { LowBudgetRulesStrategy } from '../src/strategies/low-budget.strategy';
import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('LowBudgetRulesStrategy', () => {
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
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5
}
]
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
avaliacoes: [
{
projetoId: 'proj-1',
nota: 4
}
]
},
{
id: 'p3',
nome: 'Roberto Lima',
especialidades: ['diretor'],
precoMedio: 15000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.9, 0.8],
competencias: [],
historico: [],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5
}
]
}
];

it('deve recomendar profissionais compatíveis com o papel', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 12000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

expect(result.length).toBeGreaterThan(0);

expect(
  result.every(
    (recommendation) =>
      recommendation.papel === 'diretor'
  )
).toBe(true);

});

it('deve excluir profissionais acima do limite de orçamento', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 10000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

expect(
  result.some(
    (recommendation) =>
      recommendation.profissional.id === 'p3'
  )
).toBe(false);

});

it('deve considerar o preço e a avaliação no score', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 12000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

const carlos =
  result.find(
    (recommendation) =>
      recommendation.profissional.id === 'p2'
  );

expect(carlos).toBeDefined();

expect(
  carlos!.score
).toBeGreaterThan(0);

});

it('deve usar score de avaliação igual a 0.5 quando não existem avaliações', () => {
const professionalWithoutRating: Profissional = {
id: 'p4',
nome: 'Profissional sem avaliações',
especialidades: ['diretor'],
precoMedio: 5000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.8, 0.8],
competencias: [],
historico: [],
avaliacoes: []
};

const project: Projeto = {
  id: 'proj-1',
  genero: 'Drama',
  duracaoEstimada: 90,
  orcamentoTotal: 10000,
  dataEntrega: '2026-12-15',
  tipoCaptacao: 'ficcao',
  localizacao: 'São Paulo',
  papeis: [
    {
      papel: 'diretor',
      peso: 0.9
    }
  ],
  estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    [professionalWithoutRating]
  );

expect(result).toHaveLength(1);

expect(
  result[0].score
).toBeCloseTo(
  0.6,
  5
);

});

it('deve retornar no máximo três candidatos por papel', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 12000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

expect(
  result.length
).toBeLessThanOrEqual(3);

});

it('não deve recomendar profissionais incompatíveis com o papel', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 12000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'fotógrafo',
peso: 0.8
}
],
estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

expect(result).toHaveLength(0);

});

it('deve retornar os candidatos ordenados pelo score', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 12000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'low-budget'
};

const strategy =
  new LowBudgetRulesStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

for (
  let index = 0;
  index < result.length - 1;
  index++
) {
  expect(
    result[index].score
  ).toBeGreaterThanOrEqual(
    result[index + 1].score
  );
}

});
});
