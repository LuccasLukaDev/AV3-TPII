import { describe, expect, it } from 'vitest';

import { ConsistencyVisitor } from '../src/visitors/consistency.visitor';

import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('ConsistencyVisitor', () => {
const project: Projeto = {
id: 'proj-1',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 15000,
dataEntrega: '2099-12-15',
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
},
{
papel: 'roteirista',
peso: 0.8
}
],
estrategia: 'cosine'
};

const director: Profissional = {
id: 'p1',
nome: 'Carlos Mendes',
especialidades: ['diretor'],
precoMedio: 6000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.9, 0.7],
competencias: [],
historico: [],
avaliacoes: []
};

const writer: Profissional = {
id: 'p2',
nome: 'Ana Silva',
especialidades: ['roteirista'],
precoMedio: 5000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.9, 0.8, 0.7],
competencias: [],
historico: [],
avaliacoes: []
};

it('deve considerar uma equipe completa e dentro do orçamento como consistente', () => {
const visitor =
new ConsistencyVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director,
  'diretor'
);

visitor.visitProfessional(
  writer,
  'roteirista'
);

visitor.check(
  project,
  [
    {
      papel: 'diretor',
      profissional: director
    },
    {
      papel: 'roteirista',
      profissional: writer
    }
  ]
);

const result =
  visitor.getResult();

expect(
  result.consistent
).toBe(true);

expect(
  result.missingRoles
).toEqual([]);

expect(
  result.budgetOk
).toBe(true);

expect(
  result.totalCost
).toBe(11000);

});

it('deve identificar papéis obrigatórios que não foram selecionados', () => {
const visitor =
new ConsistencyVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director,
  'diretor'
);

visitor.check(
  project,
  [
    {
      papel: 'diretor',
      profissional: director
    }
  ]
);

const result =
  visitor.getResult();

expect(
  result.consistent
).toBe(false);

expect(
  result.missingRoles
).toEqual([
  'roteirista'
]);

expect(
  result.budgetOk
).toBe(true);

expect(
  result.totalCost
).toBe(6000);

});

it('deve identificar quando o custo total ultrapassa o orçamento', () => {
const visitor =
new ConsistencyVisitor();

const expensiveProject: Projeto = {
  ...project,
  orcamentoTotal: 10000
};

visitor.visitProject(
  expensiveProject
);

visitor.visitProfessional(
  director,
  'diretor'
);

visitor.visitProfessional(
  writer,
  'roteirista'
);

visitor.check(
  expensiveProject,
  [
    {
      papel: 'diretor',
      profissional: director
    },
    {
      papel: 'roteirista',
      profissional: writer
    }
  ]
);

const result =
  visitor.getResult();

expect(
  result.consistent
).toBe(false);

expect(
  result.missingRoles
).toEqual([]);

expect(
  result.budgetOk
).toBe(false);

expect(
  result.totalCost
).toBe(11000);

});

it('não deve adicionar o preço quando o profissional é visitado sem papel', () => {
const visitor =
new ConsistencyVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director
);

const result =
  visitor.getResult();

expect(
  result.totalCost
).toBe(0);

});

it('deve reiniciar os dados ao visitar um novo projeto', () => {
const visitor =
new ConsistencyVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director,
  'diretor'
);

visitor.visitProfessional(
  writer,
  'roteirista'
);

visitor.check(
  project,
  [
    {
      papel: 'diretor',
      profissional: director
    },
    {
      papel: 'roteirista',
      profissional: writer
    }
  ]
);

expect(
  visitor.getResult().totalCost
).toBe(11000);

const newProject: Projeto = {
  ...project,
  id: 'proj-2',
  papeis: [
    {
      papel: 'diretor',
      peso: 0.9
    }
  ]
};

visitor.visitProject(
  newProject
);

const result =
  visitor.getResult();

expect(
  result.missingRoles
).toEqual([]);

expect(
  result.budgetOk
).toBe(true);

expect(
  result.totalCost
).toBe(0);

expect(
  result.consistent
).toBe(true);

});
});
