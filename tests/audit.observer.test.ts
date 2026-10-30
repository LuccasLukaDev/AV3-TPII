import { describe, expect, it, vi } from 'vitest';

import { AuditObserver } from '../src/observers/audit.observer';

describe('AuditObserver', () => {
it('deve criar um log quando um evento é recebido', () => {
const observer =
new AuditObserver();

vi.spyOn(console, 'log')
  .mockImplementation(() => {});

const data = {
  projetoId: 'proj-1'
};

observer.update(
  'team_finalized',
  data
);

const logs =
  observer.getLogs();

expect(
  logs
).toHaveLength(1);

expect(
  logs[0].event
).toBe(
  'team_finalized'
);

expect(
  logs[0].data
).toEqual(
  data
);

vi.restoreAllMocks();

});

it('deve criar um timestamp válido para o log', () => {
const observer =
new AuditObserver();

vi.spyOn(console, 'log')
  .mockImplementation(() => {});

observer.update(
  'team_finalized',
  {
    projetoId: 'proj-1'
  }
);

const logs =
  observer.getLogs();

const timestamp =
  logs[0].timestamp;

expect(
  typeof timestamp
).toBe('string');

expect(
  Number.isNaN(
    Date.parse(timestamp)
  )
).toBe(false);

vi.restoreAllMocks();

});

it('deve armazenar múltiplos eventos', () => {
const observer =
new AuditObserver();

vi.spyOn(console, 'log')
  .mockImplementation(() => {});

observer.update(
  'invitation_created',
  {
    conviteId: 'conv-1'
  }
);

observer.update(
  'professional_accepted',
  {
    profissionalId: 'prof-1'
  }
);

observer.update(
  'team_finalized',
  {
    projetoId: 'proj-1'
  }
);

const logs =
  observer.getLogs();

expect(
  logs
).toHaveLength(3);

expect(
  logs[0].event
).toBe(
  'invitation_created'
);

expect(
  logs[1].event
).toBe(
  'professional_accepted'
);

expect(
  logs[2].event
).toBe(
  'team_finalized'
);

});

it('deve preservar os dados originais de cada evento', () => {
const observer =
new AuditObserver();

vi.spyOn(console, 'log')
  .mockImplementation(() => {});

const data1 = {
  projetoId: 'proj-1',
  status: 'criado'
};

const data2 = {
  profissionalId: 'prof-1',
  status: 'aceito'
};

observer.update(
  'project_created',
  data1
);

observer.update(
  'professional_accepted',
  data2
);

const logs =
  observer.getLogs();

expect(
  logs[0].data
).toEqual(
  data1
);

expect(
  logs[1].data
).toEqual(
  data2
);

vi.restoreAllMocks();

});

it('deve registrar o log no console', () => {
const observer =
new AuditObserver();

const consoleSpy =
  vi.spyOn(console, 'log')
    .mockImplementation(() => {});

const data = {
  projetoId: 'proj-1'
};

observer.update(
  'team_finalized',
  data
);

const logs =
  observer.getLogs();

expect(
  consoleSpy
).toHaveBeenCalledTimes(1);

expect(
  consoleSpy
).toHaveBeenCalledWith(
  '[AUDIT] team_finalized',
  logs[0]
);

consoleSpy.mockRestore();

});

it('deve retornar uma lista vazia antes de qualquer evento', () => {
const observer =
new AuditObserver();

expect(
  observer.getLogs()
).toEqual([]);

});

it('deve aceitar dados complexos no log', () => {
const observer =
new AuditObserver();

vi.spyOn(console, 'log')
  .mockImplementation(() => {});

const data = {
  projeto: {
    id: 'proj-1',
    nome: 'Projeto Teste'
  },
  equipe: [
    {
      profissionalId: 'prof-1',
      papel: 'diretor'
    },
    {
      profissionalId: 'prof-2',
      papel: 'roteirista'
    }
  ]
};

observer.update(
  'team_finalized',
  data
);

const logs =
  observer.getLogs();

expect(
  logs[0].data
).toEqual(
  data
);

vi.restoreAllMocks();

});
});
