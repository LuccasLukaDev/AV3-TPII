import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TeamService } from '../src/services/team.service';
import { RecommendationService } from '../src/services/recommendation.service';
import { InvitationRepository } from '../src/repositories/invitation.repository';
import { ProjectRepository } from '../src/repositories/project.repository';
import { ProfessionalRepository } from '../src/repositories/professional.repository';
import { NotificationSubject } from '../src/observers/notification.subject';

import {
Convite,
Projeto,
Recomendacao
} from '../src/domain/entities';

describe('TeamService', () => {
let recommendationService: {
recommendForRole: ReturnType<typeof vi.fn>;
getNotificationSubject: ReturnType<typeof vi.fn>;
};

let invitationRepository: {
recommendationExists: ReturnType<typeof vi.fn>;
create: ReturnType<typeof vi.fn>;
findById: ReturnType<typeof vi.fn>;
updateStatus: ReturnType<typeof vi.fn>;
findActiveByProjectAndRole: ReturnType<typeof vi.fn>;
findAcceptedByProject: ReturnType<typeof vi.fn>;
findByProject: ReturnType<typeof vi.fn>;
};

let projectRepository: {
findById: ReturnType<typeof vi.fn>;
};

let professionalRepository: {
findAll: ReturnType<typeof vi.fn>;
};

let subject: {
notify: ReturnType<typeof vi.fn>;
};

let service: TeamService;

const project: Projeto = {
id: 'proj-2026-001',
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

const recommendation: Recomendacao = {
papel: 'diretor',
profissional: {
id: 'prof-2',
nome: 'Carlos Mendes',
especialidades: ['diretor'],
precoMedio: 8000,
disponibilidade: [
{
inicio: '2026-10-01',
fim: '2026-12-31'
}
],
localizacao: 'São Paulo',
vetorCompetencias: [0.8, 0.9, 0.7],
competencias: [
{
nome: 'Direção',
nivel: 5
}
],
historico: [],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5
}
]
},
score: 0.92,
motivo: 'Recomendação baseada em similaridade'
};

const invitation: Convite = {
id: 'convite-1',
status: 'produtor_aceitou',
papel: 'diretor',
projetoId: 'proj-2026-001',
profissionalId: 'prof-2',
createdAt: '2026-09-15T10:00:00.000Z',
updatedAt: '2026-09-15T10:00:00.000Z'
};

beforeEach(() => {
recommendationService = {
recommendForRole: vi.fn(),
getNotificationSubject: vi.fn()
};

invitationRepository = {
  recommendationExists: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  updateStatus: vi.fn(),
  findActiveByProjectAndRole: vi.fn(),
  findAcceptedByProject: vi.fn(),
  findByProject: vi.fn()
};

projectRepository = {
  findById: vi.fn()
};

professionalRepository = {
  findAll: vi.fn()
};

subject = {
  notify: vi.fn()
};

recommendationService.getNotificationSubject.mockReturnValue(
  subject
);

service = new TeamService(
  recommendationService as unknown as RecommendationService,
  invitationRepository as unknown as InvitationRepository,
  projectRepository as unknown as ProjectRepository,
  professionalRepository as unknown as ProfessionalRepository,
  subject as unknown as NotificationSubject
);

});

it('deve aceitar uma recomendação e criar um convite', async () => {
projectRepository.findById.mockResolvedValue(
project
);

invitationRepository.recommendationExists.mockResolvedValue(
  true
);

invitationRepository.create.mockResolvedValue(
  invitation
);

const result =
  await service.decideRecommendation(
    'proj-2026-001',
    'Diretor',
    'prof-2',
    'accept'
  );

expect(
  invitationRepository.recommendationExists
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  'prof-2'
);

expect(
  invitationRepository.create
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  'prof-2'
);

expect(
  result.action
).toBe('invited');

expect(
  result.convite
).toEqual(invitation);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'professional_invited',
  {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    profissionalId: 'prof-2',
    conviteId: 'convite-1'
  }
);

});

it('deve rejeitar quando o projeto não existe ao decidir uma recomendação', async () => {
projectRepository.findById.mockResolvedValue(
undefined
);

await expect(
  service.decideRecommendation(
    'projeto-inexistente',
    'diretor',
    'prof-2',
    'accept'
  )
).rejects.toThrow(
  'Projeto não encontrado.'
);

expect(
  invitationRepository.recommendationExists
).not.toHaveBeenCalled();

});

it('deve rejeitar quando o profissional não possui recomendação para o papel', async () => {
projectRepository.findById.mockResolvedValue(
project
);

invitationRepository.recommendationExists.mockResolvedValue(
  false
);

await expect(
  service.decideRecommendation(
    'proj-2026-001',
    'diretor',
    'prof-99',
    'accept'
  )
).rejects.toThrow(
  'O profissional informado não possui uma recomendação para esse papel.'
);

expect(
  invitationRepository.create
).not.toHaveBeenCalled();

});

it('deve rejeitar uma recomendação e gerar uma substituição', async () => {
projectRepository.findById.mockResolvedValue(
project
);

invitationRepository.recommendationExists.mockResolvedValue(
  true
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue(
  []
);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

const replacementInvitation: Convite = {
  ...invitation,
  id: 'convite-2',
  profissionalId: 'prof-2'
};

invitationRepository.create.mockResolvedValue(
  replacementInvitation
);

const result =
  await service.decideRecommendation(
    'proj-2026-001',
    'Diretor',
    'prof-1',
    'reject'
  );

expect(
  recommendationService.recommendForRole
).toHaveBeenCalledWith(
  project,
  'diretor',
  ['prof-1']
);

expect(
  invitationRepository.create
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  'prof-2'
);

expect(
  result.action
).toBe('replaced');

expect(
  result.novaRecomendacao
).toEqual(recommendation);

expect(
  result.convite
).toEqual(replacementInvitation);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'recommendation_rejected',
  {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    profissionalId: 'prof-1',
    novaRecomendacao: recommendation
  }
);

});

it('deve aceitar um convite de profissional', async () => {
invitationRepository.findById.mockResolvedValue(
invitation
);

const acceptedInvitation: Convite = {
  ...invitation,
  status: 'aceito'
};

invitationRepository.updateStatus.mockResolvedValue(
  acceptedInvitation
);

projectRepository.findById.mockResolvedValue(
  project
);

invitationRepository.findAcceptedByProject.mockResolvedValue(
  [
    acceptedInvitation
  ]
);

const result =
  await service.respondToInvitation(
    'convite-1',
    'accept'
  );

expect(
  invitationRepository.updateStatus
).toHaveBeenCalledWith(
  'convite-1',
  'aceito'
);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'professional_accepted_invitation',
  {
    conviteId: 'convite-1',
    projetoId: 'proj-2026-001',
    profissionalId: 'prof-2',
    papel: 'diretor'
  }
);

expect(
  result.finalized
).toBe(false);

});

it('deve finalizar a equipe quando todos os papéis forem aceitos', async () => {
const acceptedDirector: Convite = {
...invitation,
status: 'aceito',
papel: 'diretor'
};

const acceptedEditor: Convite = {
  ...invitation,
  id: 'convite-2',
  status: 'aceito',
  papel: 'editor',
  profissionalId: 'prof-3'
};

invitationRepository.findById.mockResolvedValue(
  invitation
);

invitationRepository.updateStatus.mockResolvedValue(
  acceptedDirector
);

projectRepository.findById.mockResolvedValue(
  project
);

invitationRepository.findAcceptedByProject
  .mockResolvedValueOnce([
    acceptedDirector,
    acceptedEditor
  ])
  .mockResolvedValueOnce([
    acceptedDirector,
    acceptedEditor
  ]);

const result =
  await service.respondToInvitation(
    'convite-1',
    'accept'
  );

expect(
  result.finalized
).toBe(true);

expect(
  result.equipeFinal
).toEqual([
  acceptedDirector,
  acceptedEditor
]);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'team_finalized',
  {
    projetoId: 'proj-2026-001',
    equipeFinal: [
      acceptedDirector,
      acceptedEditor
    ]
  }
);

});

it('deve rejeitar quando o convite não existe', async () => {
invitationRepository.findById.mockResolvedValue(
undefined
);

await expect(
  service.respondToInvitation(
    'convite-inexistente',
    'accept'
  )
).rejects.toThrow(
  'Convite não encontrado.'
);

});

it('deve rejeitar resposta para convite que não está aguardando resposta', async () => {
invitationRepository.findById.mockResolvedValue({
...invitation,
status: 'aceito'
});

await expect(
  service.respondToInvitation(
    'convite-1',
    'accept'
  )
).rejects.toThrow(
  'Este convite ainda não está aguardando resposta do profissional.'
);

expect(
  invitationRepository.updateStatus
).not.toHaveBeenCalled();

});

it('deve rejeitar um convite e gerar uma nova recomendação', async () => {
invitationRepository.findById.mockResolvedValue(
invitation
);

const rejectedInvitation: Convite = {
  ...invitation,
  status: 'rejeitado_profissional'
};

invitationRepository.updateStatus.mockResolvedValue(
  rejectedInvitation
);

projectRepository.findById.mockResolvedValue(
  project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue(
  []
);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

const newInvitation: Convite = {
  ...invitation,
  id: 'convite-2',
  profissionalId: 'prof-2'
};

invitationRepository.create.mockResolvedValue(
  newInvitation
);

const result =
  await service.respondToInvitation(
    'convite-1',
    'reject'
  );

expect(
  invitationRepository.updateStatus
).toHaveBeenCalledWith(
  'convite-1',
  'rejeitado_profissional'
);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'professional_rejected_invitation',
  {
    conviteId: 'convite-1',
    projetoId: 'proj-2026-001',
    profissionalId: 'prof-2',
    papel: 'diretor'
  }
);

expect(
  recommendationService.recommendForRole
).toHaveBeenCalledWith(
  project,
  'diretor',
  ['prof-2']
);

expect(
  result.convite
).toEqual(rejectedInvitation);

expect(
  result.novaRecomendacao
).toEqual(recommendation);

expect(
  result.novoConvite
).toEqual(newInvitation);

});

it('deve rejeitar quando o projeto relacionado ao convite não existe', async () => {
invitationRepository.findById.mockResolvedValue(
invitation
);

invitationRepository.updateStatus.mockResolvedValue({
  ...invitation,
  status: 'rejeitado_profissional'
});

projectRepository.findById.mockResolvedValue(
  undefined
);

await expect(
  service.respondToInvitation(
    'convite-1',
    'reject'
  )
).rejects.toThrow(
  'Projeto relacionado ao convite não encontrado.'
);

});

it('deve substituir uma recomendação através do método replace', async () => {
projectRepository.findById.mockResolvedValue(
project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue(
  []
);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

const replacementInvitation: Convite = {
  ...invitation,
  id: 'convite-2'
};

invitationRepository.create.mockResolvedValue(
  replacementInvitation
);

const result =
  await service.replace(
    'proj-2026-001',
    'DIRETOR',
    'prof-1'
  );

expect(
  recommendationService.recommendForRole
).toHaveBeenCalledWith(
  project,
  'diretor',
  ['prof-1']
);

expect(
  result.novaRecomendacao
).toEqual(recommendation);

expect(
  result.convite
).toEqual(replacementInvitation);

});

it('deve rejeitar replace quando o projeto não existe', async () => {
projectRepository.findById.mockResolvedValue(
undefined
);

await expect(
  service.replace(
    'projeto-inexistente',
    'diretor'
  )
).rejects.toThrow(
  'Projeto não encontrado.'
);

expect(
  recommendationService.recommendForRole
).not.toHaveBeenCalled();

});

it('deve buscar a equipe final do projeto', async () => {
const accepted = [
{
...invitation,
status: 'aceito'
}
];

invitationRepository.findAcceptedByProject.mockResolvedValue(
  accepted
);

const result =
  await service.getFinalTeam(
    'proj-2026-001'
  );

expect(
  invitationRepository.findAcceptedByProject
).toHaveBeenCalledWith(
  'proj-2026-001'
);

expect(
  result
).toEqual(accepted);

});

it('deve buscar todos os convites do projeto', async () => {
const invitations = [
invitation,
{
...invitation,
id: 'convite-2',
papel: 'editor'
}
];

invitationRepository.findByProject.mockResolvedValue(
  invitations
);

const result =
  await service.getProjectInvitations(
    'proj-2026-001'
  );

expect(
  invitationRepository.findByProject
).toHaveBeenCalledWith(
  'proj-2026-001'
);

expect(
  result
).toEqual(invitations);

});

it('deve excluir convites ativos e o profissional rejeitado ao buscar substituição', async () => {
const activeInvitation: Convite = {
...invitation,
id: 'convite-ativo',
profissionalId: 'prof-3',
status: 'aceito'
};

projectRepository.findById.mockResolvedValue(
  project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue([
  activeInvitation
]);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

invitationRepository.create.mockResolvedValue(
  {
    ...invitation,
    id: 'convite-novo',
    profissionalId: 'prof-4'
  }
);

await service.replace(
  'proj-2026-001',
  'diretor',
  'prof-2'
);

expect(
  recommendationService.recommendForRole
).toHaveBeenCalledWith(
  project,
  'diretor',
  expect.arrayContaining([
    'prof-3',
    'prof-2'
  ])
);

expect(
  recommendationService.recommendForRole.mock.calls[0][2]
).toHaveLength(2);

});

it('deve marcar o convite ativo como substituído quando o profissional corresponde ao profissional informado', async () => {
const activeInvitation: Convite = {
...invitation,
id: 'convite-ativo',
profissionalId: 'prof-2',
status: 'aceito'
};

projectRepository.findById.mockResolvedValue(
  project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue([
  activeInvitation
]);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

invitationRepository.updateStatus.mockResolvedValue({
  ...activeInvitation,
  status: 'substituido'
});

invitationRepository.create.mockResolvedValue(
  {
    ...invitation,
    id: 'convite-novo'
  }
);

await service.replace(
  'proj-2026-001',
  'diretor',
  'prof-2'
);

expect(
  invitationRepository.updateStatus
).toHaveBeenCalledWith(
  'convite-ativo',
  'substituido'
);

});

it('deve marcar todos os convites ativos como substituídos quando nenhum profissional específico for informado', async () => {
const firstInvitation: Convite = {
...invitation,
id: 'convite-1',
profissionalId: 'prof-2',
status: 'aceito'
};

const secondInvitation: Convite = {
  ...invitation,
  id: 'convite-2',
  profissionalId: 'prof-3',
  status: 'produtor_aceitou'
};

projectRepository.findById.mockResolvedValue(
  project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue([
  firstInvitation,
  secondInvitation
]);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

invitationRepository.create.mockResolvedValue(
  {
    ...invitation,
    id: 'convite-novo'
  }
);

await service.replace(
  'proj-2026-001',
  'diretor'
);

expect(
  invitationRepository.updateStatus
).toHaveBeenCalledTimes(2);

expect(
  invitationRepository.updateStatus
).toHaveBeenNthCalledWith(
  1,
  'convite-1',
  'substituido'
);

expect(
  invitationRepository.updateStatus
).toHaveBeenNthCalledWith(
  2,
  'convite-2',
  'substituido'
);

});

it('deve normalizar o papel ao criar uma substituição', async () => {
projectRepository.findById.mockResolvedValue(
project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue(
  []
);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

invitationRepository.create.mockResolvedValue(
  invitation
);

await service.replace(
  'proj-2026-001',
  ' DIRETOR '
);

expect(
  invitationRepository.findActiveByProjectAndRole
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor'
);

expect(
  recommendationService.recommendForRole
).toHaveBeenCalledWith(
  project,
  'diretor',
  []
);

expect(
  invitationRepository.create
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  'prof-2'
);

});

it('deve emitir professional_invited ao criar uma substituição', async () => {
projectRepository.findById.mockResolvedValue(
project
);

invitationRepository.findActiveByProjectAndRole.mockResolvedValue(
  []
);

recommendationService.recommendForRole.mockResolvedValue(
  recommendation
);

const newInvitation: Convite = {
  ...invitation,
  id: 'convite-novo'
};

invitationRepository.create.mockResolvedValue(
  newInvitation
);

await service.replace(
  'proj-2026-001',
  'diretor'
);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'professional_invited',
  {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    profissionalId: 'prof-2',
    conviteId: 'convite-novo'
  }
);

});
});
