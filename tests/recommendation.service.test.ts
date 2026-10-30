import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecommendationService } from '../src/services/recommendation.service';
import { ProfessionalRepository } from '../src/repositories/professional.repository';
import { ProjectRepository } from '../src/repositories/project.repository';
import { NotificationSubject } from '../src/observers/notification.subject';
import { AuditObserver } from '../src/observers/audit.observer';

import {
Projeto,
Profissional
} from '../src/domain/entities';

describe('RecommendationService', () => {
let professionalRepository: {
findAll: ReturnType<typeof vi.fn>;
};

let projectRepository: {
saveRecommendationResult: ReturnType<typeof vi.fn>;
saveRecommendationForRole: ReturnType<typeof vi.fn>;
};

let subject: {
notify: ReturnType<typeof vi.fn>;
};

let audit: {
getLogs: ReturnType<typeof vi.fn>;
};

let service: RecommendationService;

const professionals: Profissional[] = [
{
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
fim: '2026-12-31'
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
}
],
historico: [
'proj-1',
'proj-2',
'proj-3'
],
avaliacoes: [
{
projetoId: 'proj-1',
nota: 5,
comentario: 'Excelente'
},
{
projetoId: 'proj-2',
nota: 4,
comentario: 'Muito bom'
}
]
},
{
id: 'prof-2',
nome: 'Ana Silva',
especialidades: [
'roteirista'
],
precoMedio: 5000,
disponibilidade: [
{
inicio: '2026-10-01',
fim: '2026-12-31'
}
],
localizacao: 'Rio de Janeiro',
vetorCompetencias: [
0.7,
0.8,
0.9
],
competencias: [
{
nome: 'Roteiro',
nivel: 5
}
],
historico: [
'proj-4'
],
avaliacoes: [
{
projetoId: 'proj-3',
nota: 4,
comentario: 'Bom trabalho'
}
]
}
];

const project: Projeto = {
id: 'proj-2026-001',
genero: 'Drama',
duracaoEstimada: 90,
orcamentoTotal: 20000,
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

beforeEach(() => {
professionalRepository = {
findAll: vi.fn()
};

projectRepository = {
  saveRecommendationResult: vi.fn(),
  saveRecommendationForRole: vi.fn()
};

subject = {
  notify: vi.fn()
};

audit = {
  getLogs: vi.fn()
};

service = new RecommendationService(
  professionalRepository as unknown as ProfessionalRepository,
  projectRepository as unknown as ProjectRepository,
  subject as unknown as NotificationSubject,
  audit as unknown as AuditObserver
);

});

it('deve gerar uma recomendação para um projeto', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

const result =
  await service.recommend(project);

expect(
  result.equipe.projetoId
).toBe('proj-2026-001');

expect(
  result.equipe.recomendacoes
).toHaveLength(1);

expect(
  result.equipe.recomendacoes[0].papel
).toBe('diretor');

expect(
  result.consistency.consistent
).toBe(true);

expect(
  result.compatibility.compatibilityScore
).toBeGreaterThan(0);

expect(
  result.report
).toContain(
  'proj-2026-001'
);

});

it('deve buscar os profissionais no repository', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

await service.recommend(project);

expect(
  professionalRepository.findAll
).toHaveBeenCalledTimes(1);

});

it('deve salvar o resultado da recomendação no repository', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

await service.recommend(project);

expect(
  projectRepository.saveRecommendationResult
).toHaveBeenCalledTimes(1);

expect(
  projectRepository.saveRecommendationResult
).toHaveBeenCalledWith(
  project,
  expect.objectContaining({
    projetoId: 'proj-2026-001',
    recomendacoes: expect.any(Array)
  })
);

});

it('deve emitir o evento recommendation_generated', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

await service.recommend(project);

expect(
  subject.notify
).toHaveBeenCalledTimes(1);

expect(
  subject.notify
).toHaveBeenCalledWith(
  'recommendation_generated',
  expect.objectContaining({
    projetoId: 'proj-2026-001',
    equipe: expect.any(Object)
  })
);

});

it('deve excluir profissionais informados na recomendação', async () => {
const additionalProfessional: Profissional = {
...professionals[0],
id: 'prof-3',
nome: 'Outro Diretor'
};

professionalRepository.findAll.mockResolvedValue([
  professionals[0],
  additionalProfessional
]);

const result =
  await service.recommend(
    project,
    ['prof-1']
  );

expect(
  result.equipe.recomendacoes
).toHaveLength(1);

expect(
  result.equipe.recomendacoes[0]
    .profissional.id
).toBe('prof-3');

expect(
  result.equipe.recomendacoes[0]
    .profissional.id
).not.toBe('prof-1');

});

it('deve ignorar profissionais sem disponibilidade', async () => {
professionalRepository.findAll.mockResolvedValue([
{
...professionals[0],
disponibilidade: []
}
]);

await expect(
  service.recommend(project)
).rejects.toThrow(
  'Nenhum profissional elegível foi encontrado para o projeto.'
);

});

it('deve ignorar profissionais indisponíveis na data de entrega', async () => {
professionalRepository.findAll.mockResolvedValue([
{
...professionals[0],
disponibilidade: [
{
inicio: '2026-01-01',
fim: '2026-05-01'
}
]
}
]);

await expect(
  service.recommend(project)
).rejects.toThrow(
  'Nenhum profissional elegível foi encontrado para o projeto.'
);

});

it('deve priorizar profissionais da mesma localização', async () => {
const sameLocation = {
...professionals[0],
id: 'prof-sp',
nome: 'Profissional São Paulo'
};

const otherLocation = {
  ...professionals[0],
  id: 'prof-rj',
  nome: 'Profissional Rio',
  localizacao: 'Rio de Janeiro'
};

professionalRepository.findAll.mockResolvedValue([
  otherLocation,
  sameLocation
]);

const result =
  await service.recommend(project);

expect(
  result.equipe.recomendacoes[0]
    .profissional.localizacao
).toBe('São Paulo');

});

it('deve usar a estratégia collaborative quando configurada', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

const collaborativeProject: Projeto = {
  ...project,
  estrategia: 'collaborative'
};

const result =
  await service.recommend(
    collaborativeProject
  );

expect(
  result.equipe.recomendacoes
).toHaveLength(1);

expect(
  result.equipe.recomendacoes[0].motivo
).toContain(
  'Filtragem colaborativa'
);

});

it('deve usar a estratégia low-budget quando configurada', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

const lowBudgetProject: Projeto = {
  ...project,
  estrategia: 'low-budget',
  orcamentoTotal: 10000
};

const result =
  await service.recommend(
    lowBudgetProject
  );

expect(
  result.equipe.recomendacoes
).toHaveLength(1);

expect(
  result.equipe.recomendacoes[0].motivo
).toContain(
  'orçamento reduzido'
);

});

it('deve gerar uma nova recomendação para um papel específico', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

const result =
  await service.recommendForRole(
    project,
    'DIRETOR'
  );

expect(
  result.papel
).toBe('diretor');

expect(
  result.profissional
).toBeDefined();

expect(
  projectRepository.saveRecommendationForRole
).toHaveBeenCalledTimes(1);

expect(
  projectRepository.saveRecommendationForRole
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  result
);

});

it('deve emitir recommendation_replaced ao substituir uma recomendação', async () => {
professionalRepository.findAll.mockResolvedValue(
professionals
);

const result =
  await service.recommendForRole(
    project,
    'diretor'
  );

expect(
  subject.notify
).toHaveBeenCalledWith(
  'recommendation_replaced',
  {
    projetoId: 'proj-2026-001',
    papel: 'diretor',
    recomendacao: result
  }
);

});

it('deve aceitar papel com diferença de maiúsculas e acentuação', async () => {
const projectWithAccent: Projeto = {
...project,
papeis: [
{
papel: 'Diretor',
peso: 0.9
}
]
};

professionalRepository.findAll.mockResolvedValue(
  professionals
);

const result =
  await service.recommendForRole(
    projectWithAccent,
    ' DIRETOR '
  );

expect(
  result.papel
).toBe('diretor');

});

it('deve rejeitar quando o papel não existe no projeto', async () => {
await expect(
service.recommendForRole(
project,
'editor'
)
).rejects.toThrow(
'O papel "editor" não existe no projeto.'
);

expect(
  professionalRepository.findAll
).not.toHaveBeenCalled();

});

it('deve rejeitar quando não existem profissionais elegíveis', async () => {
professionalRepository.findAll.mockResolvedValue(
[]
);

await expect(
  service.recommend(project)
).rejects.toThrow(
  'Nenhum profissional elegível foi encontrado para o projeto.'
);

expect(
  projectRepository.saveRecommendationResult
).not.toHaveBeenCalled();

});

it('deve rejeitar recommendForRole quando não existem profissionais elegíveis', async () => {
professionalRepository.findAll.mockResolvedValue(
[]
);

await expect(
  service.recommendForRole(
    project,
    'diretor'
  )
).rejects.toThrow(
  'Nenhum profissional elegível foi encontrado para o papel "diretor".'
);

expect(
  projectRepository.saveRecommendationForRole
).not.toHaveBeenCalled();

});

it('deve retornar os logs do AuditObserver', () => {
const logs = [
{
event: 'recommendation_generated'
}
];

audit.getLogs.mockReturnValue(
  logs
);

expect(
  service.getAuditLogs()
).toEqual(logs);

expect(
  audit.getLogs
).toHaveBeenCalledTimes(1);

});

it('deve retornar o NotificationSubject', () => {
const notificationSubject =
service.getNotificationSubject();

expect(
  notificationSubject
).toBe(
  subject
);

});
});
