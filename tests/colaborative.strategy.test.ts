import { describe, expect, it } from 'vitest';

import { CollaborativeFilteringStrategy } from '../src/strategies/colaborative.strategy';
import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('CollaborativeFilteringStrategy', () => {
const professionals: Profissional[] = [
{
id: 'p1',
nome: 'Ana Silva',
especialidades: ['roteirista'],
precoMedio: 12000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.8, 0.7],
competencias: [],
historico: ['projeto-1', 'projeto-2', 'projeto-3'],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5
},
{
projetoId: 'proj-2',
nota: 4
}
]
},
{
id: 'p2',
nome: 'Carlos Mendes',
especialidades: ['diretor'],
precoMedio: 8000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.9, 0.7],
competencias: [],
historico: ['projeto-1'],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5
}
]
},
{
id: 'p3',
nome: 'Roberto Lima',
especialidades: ['diretor'],
precoMedio: 5000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.9, 0.8],
competencias: [],
historico: [],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 3
}
]
}
];

it('deve recomendar profissionais compatíveis com o papel', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

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

it('deve considerar avaliações no cálculo do score', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

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

const roberto =
  result.find(
    (recommendation) =>
      recommendation.profissional.id === 'p3'
  );

expect(carlos).toBeDefined();
expect(roberto).toBeDefined();

expect(
  carlos!.score
).toBeGreaterThan(
  roberto!.score
);

});

it('deve aplicar bônus para profissionais com histórico superior a dois projetos', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'roteirista',
peso: 0.9
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

const ana =
  result.find(
    (recommendation) =>
      recommendation.profissional.id === 'p1'
  );

expect(ana).toBeDefined();

expect(
  ana!.score
).toBeGreaterThan(0.9);

});

it('deve usar avaliação média igual a 3 quando o profissional não possui avaliações', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

const result =
  strategy.recommend(
    project,
    professionals
  );

const roberto =
  result.find(
    (recommendation) =>
      recommendation.profissional.id === 'p3'
  );

expect(roberto).toBeDefined();

expect(
  roberto!.score
).toBeCloseTo(
  0.48,
  5
);

});

it('deve retornar no máximo três candidatos por papel', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

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
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'fotógrafo',
peso: 0.8
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

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
orcamentoTotal: 35000,
dataEntrega: '2026-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
}
],
estrategia: 'collaborative'
};

const strategy =
  new CollaborativeFilteringStrategy();

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
