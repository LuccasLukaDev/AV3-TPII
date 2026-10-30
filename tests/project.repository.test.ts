import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectRepository } from '../src/repositories/project.repository';
import { prisma } from '../src/database/prisma';

describe('ProjectRepository', () => {
beforeEach(() => {
vi.restoreAllMocks();
});

const projectFromPrisma = {
id: 'proj-2026-001',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: new Date('2026-12-15T00:00:00.000Z'),
tipoCaptacao: 'ficcao',
localizacao: 'São Paulo',
estrategia: 'cosine',
papeis: [
{
papel: 'diretor',
peso: 0.9
},
{
papel: 'roteirista',
peso: 0.75
}
]
};

const project = {
id: 'proj-2026-001',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 35000,
dataEntrega: '2026-12-15T00:00:00.000Z',
tipoCaptacao: 'ficcao' as const,
localizacao: 'São Paulo',
papeis: [
{
papel: 'diretor',
peso: 0.9
},
{
papel: 'roteirista',
peso: 0.75
}
],
estrategia: 'cosine' as const
};

const recommendation = {
papel: 'diretor',
profissional: {
id: 'prof-1',
nome: 'Carlos Mendes',
especialidades: ['diretor'],
precoMedio: 6000,
disponibilidade: [],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.9],
competencias: [],
historico: [],
avaliacoes: []
},
score: 0.95,
motivo: 'Boa compatibilidade com o projeto'
};

const equipe = {
projetoId: 'proj-2026-001',
recomendacoes: [
recommendation
],
scoreGeral: 0.95,
orcamentoEstimado: 6000
};

it('deve buscar um projeto pelo ID', async () => {
const findUniqueSpy = vi
.spyOn(prisma.projeto, 'findUnique')
.mockResolvedValue(projectFromPrisma as any);

const repository =
  new ProjectRepository();

const result =
  await repository.findById(
    'proj-2026-001'
  );

expect(
  findUniqueSpy
).toHaveBeenCalledTimes(1);

expect(
  findUniqueSpy
).toHaveBeenCalledWith({
  where: {
    id: 'proj-2026-001'
  },
  include: {
    papeis: true
  }
});

expect(result).toEqual(project);

});

it('deve retornar undefined quando o projeto não existe', async () => {
vi.spyOn(
prisma.projeto,
'findUnique'
).mockResolvedValue(null);

const repository =
  new ProjectRepository();

const result =
  await repository.findById(
    'projeto-inexistente'
  );

expect(result).toBeUndefined();

});

it('deve converter corretamente a data e os papéis do projeto', async () => {
vi.spyOn(
prisma.projeto,
'findUnique'
).mockResolvedValue({
...projectFromPrisma,
dataEntrega: new Date(
'2027-05-20T15:30:00.000Z'
),
papeis: [
{
papel: 'editor',
peso: 0.8
}
]
} as any);

const repository =
  new ProjectRepository();

const result =
  await repository.findById(
    'proj-2026-001'
  );

expect(
  result?.dataEntrega
).toBe(
  '2027-05-20T15:30:00.000Z'
);

expect(
  result?.papeis
).toEqual([
  {
    papel: 'editor',
    peso: 0.8
  }
]);

});

it('deve salvar o resultado completo da recomendação', async () => {
const upsert = vi.fn();
const deletePapeis = vi.fn();
const createPapeis = vi.fn();
const deleteRecomendacoes = vi.fn();
const createRecomendacoes = vi.fn();

const transaction = vi
  .spyOn(prisma, '$transaction')
  .mockImplementation(
    async (callback: any) => {
      return callback({
        projeto: {
          upsert
        },
        papelObrigatorio: {
          deleteMany: deletePapeis,
          createMany: createPapeis
        },
        recomendacao: {
          deleteMany: deleteRecomendacoes,
          createMany: createRecomendacoes
        }
      });
    }
  );

const repository =
  new ProjectRepository();

await repository.saveRecommendationResult(
  project,
  equipe
);

expect(
  transaction
).toHaveBeenCalledTimes(1);

expect(
  upsert
).toHaveBeenCalledWith({
  where: {
    id: 'proj-2026-001'
  },
  update: {
    genero: 'Drama',
    duracaoEstimada: 90,
    orcamentoTotal: 35000,
    dataEntrega: new Date(
      '2026-12-15T00:00:00.000Z'
    ),
    tipoCaptacao: 'ficcao',
    localizacao: 'São Paulo',
    estrategia: 'cosine'
  },
  create: {
    id: 'proj-2026-001',
    genero: 'Drama',
    duracaoEstimada: 90,
    orcamentoTotal: 35000,
    dataEntrega: new Date(
      '2026-12-15T00:00:00.000Z'
    ),
    tipoCaptacao: 'ficcao',
    localizacao: 'São Paulo',
    estrategia: 'cosine'
  }
});

expect(
  deletePapeis
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001'
  }
});

expect(
  createPapeis
).toHaveBeenCalledWith({
  data: [
    {
      papel: 'diretor',
      peso: 0.9,
      projetoId: 'proj-2026-001'
    },
    {
      papel: 'roteirista',
      peso: 0.75,
      projetoId: 'proj-2026-001'
    }
  ]
});

expect(
  deleteRecomendacoes
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001'
  }
});

expect(
  createRecomendacoes
).toHaveBeenCalledWith({
  data: [
    {
      papel: 'diretor',
      score: 0.95,
      motivo: 'Boa compatibilidade com o projeto',
      projetoId: 'proj-2026-001',
      profissionalId: 'prof-1'
    }
  ]
});

});

it('não deve criar papéis ou recomendações quando as listas estiverem vazias', async () => {
const upsert = vi.fn();
const deletePapeis = vi.fn();
const createPapeis = vi.fn();
const deleteRecomendacoes = vi.fn();
const createRecomendacoes = vi.fn();

vi.spyOn(
  prisma,
  '$transaction'
).mockImplementation(
  async (callback: any) => {
    return callback({
      projeto: {
        upsert
      },
      papelObrigatorio: {
        deleteMany: deletePapeis,
        createMany: createPapeis
      },
      recomendacao: {
        deleteMany: deleteRecomendacoes,
        createMany: createRecomendacoes
      }
    });
  }
);

const repository =
  new ProjectRepository();

await repository.saveRecommendationResult(
  {
    ...project,
    papeis: []
  },
  {
    ...equipe,
    recomendacoes: []
  }
);

expect(
  deletePapeis
).toHaveBeenCalledTimes(1);

expect(
  createPapeis
).not.toHaveBeenCalled();

expect(
  deleteRecomendacoes
).toHaveBeenCalledTimes(1);

expect(
  createRecomendacoes
).not.toHaveBeenCalled();

});

it('deve salvar uma recomendação específica para um papel', async () => {
const deleteMany = vi.fn();
const create = vi.fn();

const transaction = vi
  .spyOn(prisma, '$transaction')
  .mockImplementation(
    async (callback: any) => {
      return callback({
        recomendacao: {
          deleteMany,
          create
        }
      });
    }
  );

const repository =
  new ProjectRepository();

await repository.saveRecommendationForRole(
  'proj-2026-001',
  'diretor',
  recommendation
);

expect(
  transaction
).toHaveBeenCalledTimes(1);

expect(
  deleteMany
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001',
    papel: 'diretor'
  }
});

expect(
  create
).toHaveBeenCalledWith({
  data: {
    papel: 'diretor',
    score: 0.95,
    motivo: 'Boa compatibilidade com o projeto',
    projetoId: 'proj-2026-001',
    profissionalId: 'prof-1'
  }
});

});

it('deve usar o papel da recomendação ao salvar uma recomendação específica', async () => {
const create = vi.fn();

vi.spyOn(
  prisma,
  '$transaction'
).mockImplementation(
  async (callback: any) => {
    return callback({
      recomendacao: {
        deleteMany: vi.fn(),
        create
      }
    });
  }
);

const repository =
  new ProjectRepository();

await repository.saveRecommendationForRole(
  'proj-2026-001',
  'diretor',
  {
    ...recommendation,
    papel: 'diretor de fotografia'
  }
);

expect(
  create
).toHaveBeenCalledWith({
  data: {
    papel: 'diretor de fotografia',
    score: 0.95,
    motivo: 'Boa compatibilidade com o projeto',
    projetoId: 'proj-2026-001',
    profissionalId: 'prof-1'
  }
});

});
});
