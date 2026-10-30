import { describe, expect, it } from 'vitest';

import { ReportVisitor } from '../src/visitors/report.visitor';

import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('ReportVisitor', () => {
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
vetorCompetencias: [0.8, 0.9],
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
localizacao: 'Rio de Janeiro',
vetorCompetencias: [0.9, 0.8],
competencias: [],
historico: [],
avaliacoes: []
};

it('deve gerar o cabeçalho do relatório ao visitar um projeto', () => {
const visitor =
new ReportVisitor();

visitor.visitProject(
  project
);

const result =
  visitor.getResult();

expect(result).toContain(
  '=== Relatório do Projeto proj-1 ==='
);

expect(result).toContain(
  'Gênero: Drama | Orçamento: R$ 15000'
);

expect(result).toContain(
  'Tipo: ficcao | Entrega: 2099-12-15'
);

expect(result).toContain(
  '--- Equipe ---'
);

});

it('deve adicionar um profissional com seu papel ao relatório', () => {
const visitor =
new ReportVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director,
  'diretor'
);

const result =
  visitor.getResult();

expect(result).toContain(
  'diretor: Carlos Mendes (R$ 6000) - São Paulo'
);

});

it('deve usar "Profissional" quando nenhum papel for informado', () => {
const visitor =
new ReportVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director
);

const result =
  visitor.getResult();

expect(result).toContain(
  'Profissional: Carlos Mendes (R$ 6000) - São Paulo'
);

});

it('deve adicionar vários profissionais ao relatório', () => {
const visitor =
new ReportVisitor();

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

const result =
  visitor.getResult();

expect(result).toContain(
  'diretor: Carlos Mendes (R$ 6000) - São Paulo'
);

expect(result).toContain(
  'roteirista: Ana Silva (R$ 5000) - Rio de Janeiro'
);

});

it('deve separar as linhas do relatório com quebra de linha', () => {
const visitor =
new ReportVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director,
  'diretor'
);

const result =
  visitor.getResult();

const lines =
  result.split('\n');

expect(lines.length).toBe(5);

expect(lines[0]).toBe(
  '=== Relatório do Projeto proj-1 ==='
);

expect(lines[4]).toBe(
  'diretor: Carlos Mendes (R$ 6000) - São Paulo'
);

});

it('deve limpar o relatório anterior ao visitar outro projeto', () => {
const visitor =
new ReportVisitor();

visitor.visitProject(
  project
);

visitor.visitProfessional(
  director,
  'diretor'
);

const newProject: Projeto = {
  ...project,
  id: 'proj-2',
  genero: 'Comédia',
  orcamentoTotal: 20000
};

visitor.visitProject(
  newProject
);

const result =
  visitor.getResult();

expect(result).toContain(
  '=== Relatório do Projeto proj-2 ==='
);

expect(result).toContain(
  'Gênero: Comédia | Orçamento: R$ 20000'
);

expect(result).not.toContain(
  'proj-1'
);

expect(result).not.toContain(
  'Carlos Mendes'
);

});

it('deve retornar uma string vazia antes de visitar qualquer projeto', () => {
const visitor =
new ReportVisitor();

expect(
  visitor.getResult()
).toBe('');

});
});
