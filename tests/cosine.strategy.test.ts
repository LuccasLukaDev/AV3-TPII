import { describe, expect, it } from 'vitest';

import { CosineSimilarityStrategy } from '../src/strategies/cosine.strategy';
import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('CosineSimilarityStrategy', () => {
const professionals: Profissional[] = [
{
id: 'p1',
nome: 'Ana Silva',
especialidades: ['roteirista'],
precoMedio: 12000,
disponibilidade: [
{
inicio: '2026-01-01',
fim: '2026-12-31'
}
],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.8, 0.7],
competencias: [],
historico: [],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5,
comentario: 'Excelente profissional'
}
]
},
{
id: 'p2',
nome: 'Carlos Mendes',
especialidades: ['diretor de fotografia'],
precoMedio: 8000,
disponibilidade: [
{
inicio: '2026-01-01',
fim: '2026-12-31'
}
],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.9, 0.7],
competencias: [],
historico: [],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 4,
comentario: 'Bom profissional'
}
]
},
{
id: 'p3',
nome: 'João Santos',
especialidades: ['editor'],
precoMedio: 6000,
disponibilidade: [
{
inicio: '2026-01-01',
fim: '2026-12-31'
}
],
localizacao: 'São Paulo',
vetorCompetencias: [0.7, 0.8, 0.9],
competencias: [],
historico: [],
avaliacoes: []
},
{
id: 'p4',
nome: 'Roberto Lima',
especialidades: ['diretor'],
precoMedio: 5000,
disponibilidade: [
{
inicio: '2026-01-01',
fim: '2026-12-31'
}
],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.9, 0.8],
competencias: [],
historico: [],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5,
comentario: 'Excelente'
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
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
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

it('deve recomendar profissionais com especialidade compatível com o papel', () => {
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
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
  project,
  professionals
);

expect(result.length).toBeGreaterThan(0);

expect(
  result.every(
    (recommendation) => {
      const role =
        recommendation.papel.toLowerCase();

      return recommendation.profissional.especialidades.some(
        (especialidade) => {
          const specialty =
            especialidade.toLowerCase();

          return (
            specialty.includes(role) ||
            role.includes(specialty)
          );
        }
      );
    }
  )
).toBe(true);

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
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
  project,
  professionals
);

expect(
  result.length
).toBeLessThanOrEqual(3);

});

it('deve gerar um score numérico entre zero e um', () => {
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
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
  project,
  professionals
);

expect(
  result.length
).toBeGreaterThan(0);

for (const recommendation of result) {
  expect(
    recommendation.score
  ).toBeGreaterThanOrEqual(0);

  expect(
    recommendation.score
  ).toBeLessThanOrEqual(1);
}

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
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
  project,
  professionals
);

expect(result).toHaveLength(0);

});

it('deve processar múltiplos papéis do projeto', () => {
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
},
{
papel: 'editor',
peso: 0.7
}
],
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
  project,
  professionals
);

const roles = result.map(
  (recommendation) =>
    recommendation.papel
);

expect(roles).toContain('diretor');
expect(roles).toContain('editor');

});

it('deve retornar o resultado ordenado pelo score', () => {
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
estrategia: 'cosine'
};

const strategy = new CosineSimilarityStrategy();

const result = strategy.recommend(
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
