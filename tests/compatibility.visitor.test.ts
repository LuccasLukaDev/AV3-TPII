import { describe, expect, it } from 'vitest';

import { CompatibilityVisitor } from '../src/visitors/compatibility.visitor';

import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('CompatibilityVisitor', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2099-12-15',
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

it('deve retornar score zero quando nenhum profissional foi visitado', () => {
const visitor =
new CompatibilityVisitor();

visitor.visitProject(
  project
);

const result =
  visitor.getResult();

expect(
  result.compatibilityScore
).toBe(0);

});

it('deve calcular o score com base na média das avaliações do profissional', () => {
const visitor =
new CompatibilityVisitor();

const professional: Profissional = {
  id: 'p1',
  nome: 'Ana Silva',
  especialidades: ['diretor'],
  precoMedio: 6000,
  disponibilidade: [],
  localizacao: 'São Paulo',
  vetorCompetencias: [0.9, 0.8, 0.7],
  competencias: [],
  historico: [],
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
};

visitor.visitProject(
  project
);

visitor.visitProfessional(
  professional
);

const result =
  visitor.getResult();

expect(
  result.compatibilityScore
).toBe(0.9);

});

it('deve usar avaliação padrão 3 quando o profissional não possui avaliações', () => {
const visitor =
new CompatibilityVisitor();

const professional: Profissional = {
  id: 'p2',
  nome: 'Carlos Mendes',
  especialidades: ['diretor'],
  precoMedio: 5000,
  disponibilidade: [],
  localizacao: 'São Paulo',
  vetorCompetencias: [0.8, 0.9, 0.7],
  competencias: [],
  historico: [],
  avaliacoes: []
};

visitor.visitProject(
  project
);

visitor.visitProfessional(
  professional
);

const result =
  visitor.getResult();

expect(
  result.compatibilityScore
).toBe(0.6);

});

it('deve calcular a média de compatibilidade entre vários profissionais', () => {
const visitor =
new CompatibilityVisitor();

const professional1: Profissional = {
  id: 'p1',
  nome: 'Ana Silva',
  especialidades: ['diretor'],
  precoMedio: 6000,
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
};

const professional2: Profissional = {
  id: 'p2',
  nome: 'Carlos Mendes',
  especialidades: ['editor'],
  precoMedio: 5000,
  disponibilidade: [],
  localizacao: 'São Paulo',
  vetorCompetencias: [0.8, 0.9, 0.7],
  competencias: [],
  historico: [],
  avaliacoes: [
    {
      projetoId: 'proj-1',
      nota: 3
    }
  ]
};

visitor.visitProject(
  project
);

visitor.visitProfessional(
  professional1
);

visitor.visitProfessional(
  professional2
);

const result =
  visitor.getResult();

expect(
  result.compatibilityScore
).toBe(0.8);

});

it('deve reiniciar os scores ao visitar um novo projeto', () => {
const visitor =
new CompatibilityVisitor();

const professional: Profissional = {
  id: 'p1',
  nome: 'Ana Silva',
  especialidades: ['diretor'],
  precoMedio: 6000,
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
};

visitor.visitProject(
  project
);

visitor.visitProfessional(
  professional
);

expect(
  visitor.getResult()
    .compatibilityScore
).toBe(1);

visitor.visitProject(
  project
);

expect(
  visitor.getResult()
    .compatibilityScore
).toBe(0);

});
});
