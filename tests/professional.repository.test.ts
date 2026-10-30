import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ProfessionalRepository } from '../src/repositories/professional.repository';
import { prisma } from '../src/database/prisma';

describe('ProfessionalRepository', () => {
const professionalFromPrisma = {
id: 'prof-1',
nome: 'Carlos Mendes',
especialidades: [
'diretor',
'diretor de fotografia'
],
precoMedio: 6000,
localizacao: 'São Paulo',
vetorCompetencias: [
0.8,
0.9,
0.7
],
historico: [
'proj-1',
'proj-2'
],
disponibilidades: [
{
inicio: new Date('2026-10-01T00:00:00.000Z'),
fim: new Date('2026-10-31T00:00:00.000Z')
}
],
competencias: [
{
nome: 'Direção',
nivel: 5
},
{
nome: 'Fotografia',
nivel: 4
}
],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5,
comentario: 'Excelente profissional'
},
{
projetoId: 'proj-2',
nota: 4,
comentario: null
}
]
};

beforeEach(() => {
vi.restoreAllMocks();
});

it('deve buscar todos os profissionais no Prisma', async () => {
const findManySpy =
vi.spyOn(
prisma.profissional,
'findMany'
).mockResolvedValue([
professionalFromPrisma
] as any);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findAll();

expect(
  findManySpy
).toHaveBeenCalledTimes(1);

expect(
  findManySpy
).toHaveBeenCalledWith({
  include: {
    disponibilidades: true,
    competencias: true,
    avaliacoes: true
  }
});

expect(
  result
).toHaveLength(1);

});

it('deve converter corretamente um profissional do Prisma para o domínio', async () => {
vi.spyOn(
prisma.profissional,
'findMany'
).mockResolvedValue([
professionalFromPrisma
] as any);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findAll();

expect(
  result[0]
).toEqual({
  id: 'prof-1',
  nome: 'Carlos Mendes',
  especialidades: [
    'diretor',
    'diretor de fotografia'
  ],
  precoMedio: 6000,
  disponibilidade: [
    {
      inicio: '2026-10-01',
      fim: '2026-10-31'
    }
  ],
  localizacao: 'São Paulo',
  vetorCompetencias: [
    0.8,
    0.9,
    0.7
  ],
  competencias: [
    {
      nome: 'Direção',
      nivel: 5
    },
    {
      nome: 'Fotografia',
      nivel: 4
    }
  ],
  historico: [
    'proj-1',
    'proj-2'
  ],
  avaliacoes: [
    {
      projetoId: 'proj-1',
      nota: 5,
      comentario: 'Excelente profissional'
    },
    {
      projetoId: 'proj-2',
      nota: 4,
      comentario: undefined
    }
  ]
});

});

it('deve buscar um profissional pelo ID', async () => {
const findUniqueSpy =
vi.spyOn(
prisma.profissional,
'findUnique'
).mockResolvedValue(
professionalFromPrisma as any
);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findById(
    'prof-1'
  );

expect(
  findUniqueSpy
).toHaveBeenCalledTimes(1);

expect(
  findUniqueSpy
).toHaveBeenCalledWith({
  where: {
    id: 'prof-1'
  },
  include: {
    disponibilidades: true,
    competencias: true,
    avaliacoes: true
  }
});

expect(
  result?.id
).toBe('prof-1');

expect(
  result?.nome
).toBe('Carlos Mendes');

});

it('deve retornar undefined quando o profissional não existe', async () => {
vi.spyOn(
prisma.profissional,
'findUnique'
).mockResolvedValue(
null
);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findById(
    'prof-inexistente'
  );

expect(
  result
).toBeUndefined();

});

it('deve converter datas das disponibilidades para YYYY-MM-DD', async () => {
vi.spyOn(
prisma.profissional,
'findMany'
).mockResolvedValue([
{
...professionalFromPrisma,
disponibilidades: [
{
inicio: new Date(
'2026-12-15T10:30:00.000Z'
),
fim: new Date(
'2026-12-20T18:45:00.000Z'
)
}
]
}
] as any);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findAll();

expect(
  result[0].disponibilidade
).toEqual([
  {
    inicio: '2026-12-15',
    fim: '2026-12-20'
  }
]);

});

it('deve converter avaliações e transformar comentário null em undefined', async () => {
vi.spyOn(
prisma.profissional,
'findMany'
).mockResolvedValue([
{
...professionalFromPrisma,
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5,
comentario: 'Muito bom'
},
{
projetoId: 'proj-2',
nota: 3,
comentario: null
}
]
}
] as any);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findAll();

expect(
  result[0].avaliacoes
).toEqual([
  {
    projetoId: 'proj-1',
    nota: 5,
    comentario: 'Muito bom'
  },
  {
    projetoId: 'proj-2',
    nota: 3,
    comentario: undefined
  }
]);

});

it('deve retornar uma lista vazia quando não existem profissionais', async () => {
vi.spyOn(
prisma.profissional,
'findMany'
).mockResolvedValue([]);

const repository =
  new ProfessionalRepository();

const result =
  await repository.findAll();

expect(
  result
).toEqual([]);

});
});
