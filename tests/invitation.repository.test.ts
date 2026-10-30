import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InvitationRepository } from '../src/repositories/invitation.repository';
import { prisma } from '../src/database/prisma';

describe('InvitationRepository', () => {
beforeEach(() => {
vi.restoreAllMocks();
});

const invitation = {
id: 'convite-1',
projetoId: 'proj-2026-001',
papel: 'diretor',
profissionalId: 'prof-1',
status: 'produtor_aceitou',
createdAt: new Date('2026-09-15T10:00:00.000Z'),
updatedAt: new Date('2026-09-15T10:00:00.000Z'),
profissional: {
id: 'prof-1',
nome: 'Carlos Mendes'
},
projeto: {
id: 'proj-2026-001',
genero: 'Drama'
}
};

it('deve criar um convite com status produtor_aceitou', async () => {
const createSpy = vi
.spyOn(prisma.convite, 'create')
.mockResolvedValue(invitation as any);

const repository =
  new InvitationRepository();

const result =
  await repository.create(
    'proj-2026-001',
    'diretor',
    'prof-1'
  );

expect(
  createSpy
).toHaveBeenCalledTimes(1);

expect(
  createSpy
).toHaveBeenCalledWith({
  data: {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    profissionalId: 'prof-1',
    status: 'produtor_aceitou'
  },
  include: {
    profissional: true,
    projeto: true
  }
});

expect(
  result
).toEqual(invitation);

});

it('deve buscar um convite pelo ID', async () => {
const findUniqueSpy = vi
.spyOn(prisma.convite, 'findUnique')
.mockResolvedValue(invitation as any);

const repository =
  new InvitationRepository();

const result =
  await repository.findById(
    'convite-1'
  );

expect(
  findUniqueSpy
).toHaveBeenCalledTimes(1);

expect(
  findUniqueSpy
).toHaveBeenCalledWith({
  where: {
    id: 'convite-1'
  },
  include: {
    profissional: true,
    projeto: true
  }
});

expect(
  result
).toEqual(invitation);

});

it('deve retornar null quando o convite não existe', async () => {
vi.spyOn(
prisma.convite,
'findUnique'
).mockResolvedValue(null);

const repository =
  new InvitationRepository();

const result =
  await repository.findById(
    'convite-inexistente'
  );

expect(
  result
).toBeNull();

});

it('deve buscar todos os convites de um projeto em ordem crescente de criação', async () => {
const findManySpy = vi
.spyOn(prisma.convite, 'findMany')
.mockResolvedValue([
invitation
] as any);

const repository =
  new InvitationRepository();

const result =
  await repository.findByProject(
    'proj-2026-001'
  );

expect(
  findManySpy
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001'
  },
  include: {
    profissional: true
  },
  orderBy: {
    createdAt: 'asc'
  }
});

expect(
  result
).toEqual([
  invitation
]);

});

it('deve buscar convites de um projeto filtrando pelo papel', async () => {
const findManySpy = vi
.spyOn(prisma.convite, 'findMany')
.mockResolvedValue([
invitation
] as any);

const repository =
  new InvitationRepository();

const result =
  await repository.findByProjectAndRole(
    'proj-2026-001',
    'diretor'
  );

expect(
  findManySpy
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001',
    papel: 'diretor'
  },
  include: {
    profissional: true
  },
  orderBy: {
    createdAt: 'desc'
  }
});

expect(
  result
).toEqual([
  invitation
]);

});

it('deve buscar apenas convites ativos de um projeto e papel', async () => {
const findManySpy = vi
.spyOn(prisma.convite, 'findMany')
.mockResolvedValue([
invitation
] as any);

const repository =
  new InvitationRepository();

const result =
  await repository.findActiveByProjectAndRole(
    'proj-2026-001',
    'diretor'
  );

expect(
  findManySpy
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    status: {
      in: [
        'produtor_aceitou',
        'aceito'
      ]
    }
  },
  include: {
    profissional: true
  },
  orderBy: {
    createdAt: 'desc'
  }
});

expect(
  result
).toEqual([
  invitation
]);

});

it('deve buscar apenas convites aceitos de um projeto', async () => {
const acceptedInvitation = {
...invitation,
status: 'aceito'
};

const findManySpy = vi
  .spyOn(prisma.convite, 'findMany')
  .mockResolvedValue([
    acceptedInvitation
  ] as any);

const repository =
  new InvitationRepository();

const result =
  await repository.findAcceptedByProject(
    'proj-2026-001'
  );

expect(
  findManySpy
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001',
    status: 'aceito'
  },
  include: {
    profissional: true
  },
  orderBy: {
    papel: 'asc'
  }
});

expect(
  result
).toEqual([
  acceptedInvitation
]);

});

it('deve atualizar o status de um convite', async () => {
const updatedInvitation = {
...invitation,
status: 'aceito'
};

const updateSpy = vi
  .spyOn(prisma.convite, 'update')
  .mockResolvedValue(
    updatedInvitation as any
  );

const repository =
  new InvitationRepository();

const result =
  await repository.updateStatus(
    'convite-1',
    'aceito'
  );

expect(
  updateSpy
).toHaveBeenCalledTimes(1);

expect(
  updateSpy
).toHaveBeenCalledWith({
  where: {
    id: 'convite-1'
  },
  data: {
    status: 'aceito'
  },
  include: {
    profissional: true,
    projeto: true
  }
});

expect(
  result
).toEqual(updatedInvitation);

});

it('deve retornar true quando existe uma recomendação para o profissional e papel', async () => {
const findFirstSpy = vi
.spyOn(prisma.recomendacao, 'findFirst')
.mockResolvedValue({
id: 'rec-1',
projetoId: 'proj-2026-001',
papel: 'diretor',
profissionalId: 'prof-1'
} as any);

const repository =
  new InvitationRepository();

const result =
  await repository.recommendationExists(
    'proj-2026-001',
    'diretor',
    'prof-1'
  );

expect(
  findFirstSpy
).toHaveBeenCalledWith({
  where: {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    profissionalId: 'prof-1'
  }
});

expect(
  result
).toBe(true);

});

it('deve retornar false quando não existe uma recomendação', async () => {
vi.spyOn(
prisma.recomendacao,
'findFirst'
).mockResolvedValue(null);

const repository =
  new InvitationRepository();

const result =
  await repository.recommendationExists(
    'proj-2026-001',
    'diretor',
    'prof-inexistente'
  );

expect(
  result
).toBe(false);

});
});
