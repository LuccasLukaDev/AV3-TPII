import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

import { recommendationRoutes } from '../src/controllers/recommendation.controller';
import { RecommendationService } from '../src/services/recommendation.service';
import { TeamService } from '../src/services/team.service';
import { AuditObserver } from '../src/observers/audit.observer';

describe('Recommendation Controller', () => {
let app: FastifyInstance;

beforeEach(async () => {
app = Fastify();

await app.register(
  recommendationRoutes
);

await app.ready();

});

afterEach(async () => {
vi.restoreAllMocks();
await app.close();
});

const validProject = {
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

it('deve gerar uma recomendação com sucesso', async () => {
const result = {
equipe: {
projetoId: 'proj-2026-001',
recomendacoes: [],
scoreGeral: 0.9,
orcamentoEstimado: 10000
},
consistency: {
consistent: true
},
compatibility: {
compatibilityScore: 0.9
},
report: 'Relatório do projeto'
};

const recommendSpy =
  vi.spyOn(
    RecommendationService.prototype,
    'recommend'
  ).mockResolvedValue(
    result
  );

const response =
  await app.inject({
    method: 'POST',
    url: '/recommend',
    payload: validProject
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual(result);

expect(
  recommendSpy
).toHaveBeenCalledTimes(1);

expect(
  recommendSpy
).toHaveBeenCalledWith(
  validProject
);

});

it('deve retornar 400 quando o projeto enviado para /recommend for inválido', async () => {
const invalidProject = {
...validProject,
duracaoEstimada: -10
};

const response =
  await app.inject({
    method: 'POST',
    url: '/recommend',
    payload: invalidProject
  });

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});

it('deve retornar 400 quando /recommend receber um papel sem peso válido', async () => {
const invalidProject = {
...validProject,
papeis: [
{
papel: 'diretor',
peso: 2
}
]
};

const response =
  await app.inject({
    method: 'POST',
    url: '/recommend',
    payload: invalidProject
  });

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});

it('deve retornar 400 quando o RecommendationService gerar um erro', async () => {
vi.spyOn(
RecommendationService.prototype,
'recommend'
).mockRejectedValue(
new Error('Erro de teste')
);

const response =
  await app.inject({
    method: 'POST',
    url: '/recommend',
    payload: validProject
  });

expect(
  response.statusCode
).toBe(400);

expect(
  response.json()
).toEqual({
  error: 'Erro de teste'
});

});

it('deve aceitar uma recomendação pelo endpoint de decisão', async () => {
const result = {
action: 'invited',
convite: {
id: 'convite-1',
papel: 'diretor'
}
};

const decideSpy =
  vi.spyOn(
    TeamService.prototype,
    'decideRecommendation'
  ).mockResolvedValue(
    result as never
  );

const response =
  await app.inject({
    method: 'POST',
    url: '/projects/proj-2026-001/recommendations/decision',
    payload: {
      papel: 'diretor',
      profissionalId: 'prof-1',
      decision: 'accept'
    }
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual(result);

expect(
  decideSpy
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  'prof-1',
  'accept'
);

});

it('deve retornar 400 quando a decisão da recomendação for inválida', async () => {
const response =
await app.inject({
method: 'POST',
url: '/projects/proj-2026-001/recommendations/decision',
payload: {
papel: 'diretor',
profissionalId: 'prof-1',
decision: 'invalid'
}
});

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});

it('deve retornar 400 quando o TeamService gerar erro na decisão', async () => {
vi.spyOn(
TeamService.prototype,
'decideRecommendation'
).mockRejectedValue(
new Error('Erro na decisão')
);

const response =
  await app.inject({
    method: 'POST',
    url: '/projects/proj-2026-001/recommendations/decision',
    payload: {
      papel: 'diretor',
      profissionalId: 'prof-1',
      decision: 'reject'
    }
  });

expect(
  response.statusCode
).toBe(400);

expect(
  response.json()
).toEqual({
  error: 'Erro na decisão'
});

});

it('deve aceitar a resposta de um profissional ao convite', async () => {
const result = {
convite: {
id: 'convite-1',
status: 'aceito'
},
finalized: false
};

const responseSpy =
  vi.spyOn(
    TeamService.prototype,
    'respondToInvitation'
  ).mockResolvedValue(
    result as never
  );

const response =
  await app.inject({
    method: 'PATCH',
    url: '/invites/convite-1/response',
    payload: {
      response: 'accept'
    }
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual(result);

expect(
  responseSpy
).toHaveBeenCalledWith(
  'convite-1',
  'accept'
);

});

it('deve retornar 400 quando a resposta do convite for inválida', async () => {
const response =
await app.inject({
method: 'PATCH',
url: '/invites/convite-1/response',
payload: {
response: 'maybe'
}
});

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});

it('deve substituir um profissional pelo endpoint de replace', async () => {
const result = {
novaRecomendacao: {
papel: 'diretor',
profissional: {
id: 'prof-2'
}
},
convite: {
id: 'convite-2'
}
};

const replaceSpy =
  vi.spyOn(
    TeamService.prototype,
    'replace'
  ).mockResolvedValue(
    result as never
  );

const response =
  await app.inject({
    method: 'POST',
    url: '/projects/proj-2026-001/replace',
    payload: {
      papel: 'diretor',
      profissionalId: 'prof-1'
    }
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual({
  projetoId: 'proj-2026-001',
  novaRecomendacao: result
});

expect(
  replaceSpy
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  'prof-1'
);

});

it('deve permitir replace sem informar profissionalId', async () => {
const result = {
novaRecomendacao: {
papel: 'diretor'
},
convite: {
id: 'convite-2'
}
};

const replaceSpy =
  vi.spyOn(
    TeamService.prototype,
    'replace'
  ).mockResolvedValue(
    result as never
  );

const response =
  await app.inject({
    method: 'POST',
    url: '/projects/proj-2026-001/replace',
    payload: {
      papel: 'diretor'
    }
  });

expect(
  response.statusCode
).toBe(200);

expect(
  replaceSpy
).toHaveBeenCalledWith(
  'proj-2026-001',
  'diretor',
  undefined
);

});

it('deve retornar 400 quando o replace receber um papel vazio', async () => {
const response =
await app.inject({
method: 'POST',
url: '/projects/proj-2026-001/replace',
payload: {
papel: ''
}
});

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});

it('deve listar os convites do projeto', async () => {
const invitations = [
{
id: 'convite-1',
papel: 'diretor',
status: 'aceito'
},
{
id: 'convite-2',
papel: 'editor',
status: 'produtor_aceitou'
}
];

const getInvitationsSpy =
  vi.spyOn(
    TeamService.prototype,
    'getProjectInvitations'
  ).mockResolvedValue(
    invitations as never
  );

const response =
  await app.inject({
    method: 'GET',
    url: '/projects/proj-2026-001/invites'
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual(invitations);

expect(
  getInvitationsSpy
).toHaveBeenCalledWith(
  'proj-2026-001'
);

});

it('deve retornar a equipe final do projeto', async () => {
const finalTeam = [
{
id: 'convite-1',
papel: 'diretor',
profissionalId: 'prof-1',
status: 'aceito'
}
];

const getFinalTeamSpy =
  vi.spyOn(
    TeamService.prototype,
    'getFinalTeam'
  ).mockResolvedValue(
    finalTeam as never
  );

const response =
  await app.inject({
    method: 'GET',
    url: '/projects/proj-2026-001/team'
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual({
  projetoId: 'proj-2026-001',
  equipeFinal: finalTeam
});

expect(
  getFinalTeamSpy
).toHaveBeenCalledWith(
  'proj-2026-001'
);

});

it('deve retornar os logs de auditoria', async () => {
const logs = [
{
event: 'recommendation_generated',
data: {
projetoId: 'proj-2026-001'
}
}
];

const auditSpy =
  vi.spyOn(
    AuditObserver.prototype,
    'getLogs'
  ).mockReturnValue(
    logs
  );

const response =
  await app.inject({
    method: 'GET',
    url: '/audit'
  });

expect(
  response.statusCode
).toBe(200);

expect(
  response.json()
).toEqual(logs);

expect(
  auditSpy
).toHaveBeenCalledTimes(1);

});

it('deve retornar 400 quando o replace gerar erro', async () => {
vi.spyOn(
TeamService.prototype,
'replace'
).mockRejectedValue(
new Error('Projeto não encontrado.')
);

const response =
  await app.inject({
    method: 'POST',
    url: '/projects/proj-inexistente/replace',
    payload: {
      papel: 'diretor'
    }
  });

expect(
  response.statusCode
).toBe(400);

expect(
  response.json()
).toEqual({
  error: 'Projeto não encontrado.'
});

});

it('deve retornar 400 quando a resposta do convite gerar erro no TeamService', async () => {
vi.spyOn(
TeamService.prototype,
'respondToInvitation'
).mockRejectedValue(
new Error('Convite não encontrado.')
);

const response =
  await app.inject({
    method: 'PATCH',
    url: '/invites/convite-inexistente/response',
    payload: {
      response: 'reject'
    }
  });

expect(
  response.statusCode
).toBe(400);

expect(
  response.json()
).toEqual({
  error: 'Convite não encontrado.'
});

});

it('deve retornar 400 quando o endpoint de decisão receber papel vazio', async () => {
const response =
await app.inject({
method: 'POST',
url: '/projects/proj-2026-001/recommendations/decision',
payload: {
papel: '',
profissionalId: 'prof-1',
decision: 'accept'
}
});

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});

it('deve retornar 400 quando o endpoint de decisão receber profissionalId vazio', async () => {
const response =
await app.inject({
method: 'POST',
url: '/projects/proj-2026-001/recommendations/decision',
payload: {
papel: 'diretor',
profissionalId: '',
decision: 'accept'
}
});

expect(
  response.statusCode
).toBe(400);

expect(
  response.json().error
).toBeDefined();

});
});
