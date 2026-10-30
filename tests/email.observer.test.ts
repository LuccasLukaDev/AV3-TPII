import { describe, expect, it, vi } from 'vitest';

import { EmailObserver } from '../src/observers/email.observer';

describe('EmailObserver', () => {
it('deve registrar o evento recebido no console', () => {
const observer =
new EmailObserver();

const consoleSpy =
  vi.spyOn(console, 'log')
    .mockImplementation(() => {});

observer.update(
  'team_finalized',
  {
    projetoId: 'proj-1'
  }
);

expect(
  consoleSpy
).toHaveBeenCalledTimes(1);

expect(
  consoleSpy.mock.calls[0][0]
).toBe(
  '[EMAIL] Evento: team_finalized'
);

consoleSpy.mockRestore();

});

it('deve registrar os dados recebidos como JSON formatado', () => {
const observer =
new EmailObserver();

const consoleSpy =
  vi.spyOn(console, 'log')
    .mockImplementation(() => {});

const data = {
  projetoId: 'proj-1',
  status: 'finalizado'
};

observer.update(
  'team_finalized',
  data
);

expect(
  consoleSpy.mock.calls[0][1]
).toBe(
  JSON.stringify(data, null, 2)
);

consoleSpy.mockRestore();

});

it('deve registrar eventos diferentes corretamente', () => {
const observer =
new EmailObserver();

const consoleSpy =
  vi.spyOn(console, 'log')
    .mockImplementation(() => {});

observer.update(
  'invitation_created',
  {
    conviteId: 'conv-1'
  }
);

expect(
  consoleSpy
).toHaveBeenCalledWith(
  '[EMAIL] Evento: invitation_created',
  JSON.stringify(
    {
      conviteId: 'conv-1'
    },
    null,
    2
  )
);

consoleSpy.mockRestore();

});

it('deve lidar com objetos com estruturas aninhadas', () => {
const observer =
new EmailObserver();

const consoleSpy =
  vi.spyOn(console, 'log')
    .mockImplementation(() => {});

const data = {
  projeto: {
    id: 'proj-1',
    nome: 'Projeto Teste'
  },
  profissional: {
    id: 'prof-1',
    nome: 'Carlos Mendes'
  }
};

observer.update(
  'professional_accepted',
  data
);

expect(
  consoleSpy
).toHaveBeenCalledWith(
  '[EMAIL] Evento: professional_accepted',
  JSON.stringify(
    data,
    null,
    2
  )
);

consoleSpy.mockRestore();

});

it('deve funcionar com dados vazios', () => {
const observer =
new EmailObserver();

const consoleSpy =
  vi.spyOn(console, 'log')
    .mockImplementation(() => {});

observer.update(
  'test_event',
  {}
);

expect(
  consoleSpy
).toHaveBeenCalledWith(
  '[EMAIL] Evento: test_event',
  '{}'
);

consoleSpy.mockRestore();

});
});
