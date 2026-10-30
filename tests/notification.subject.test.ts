import { describe, expect, it, vi } from 'vitest';

import { NotificationSubject } from '../src/observers/notification.subject';
import { Observer } from '../src/observers/observer';

describe('NotificationSubject', () => {
it('deve anexar um observer e notificá-lo', () => {
const subject =
new NotificationSubject();

const observer: Observer = {
  update: vi.fn()
};

subject.attach(
  observer
);

const data = {
  projetoId: 'proj-1'
};

subject.notify(
  'team_finalized',
  data
);

expect(
  observer.update
).toHaveBeenCalledTimes(1);

expect(
  observer.update
).toHaveBeenCalledWith(
  'team_finalized',
  data
);

});

it('deve notificar todos os observers anexados', () => {
const subject =
new NotificationSubject();

const observer1: Observer = {
  update: vi.fn()
};

const observer2: Observer = {
  update: vi.fn()
};

subject.attach(
  observer1
);

subject.attach(
  observer2
);

const data = {
  projetoId: 'proj-1'
};

subject.notify(
  'team_finalized',
  data
);

expect(
  observer1.update
).toHaveBeenCalledWith(
  'team_finalized',
  data
);

expect(
  observer2.update
).toHaveBeenCalledWith(
  'team_finalized',
  data
);

});

it('não deve notificar um observer depois que ele for removido', () => {
const subject =
new NotificationSubject();

const observer: Observer = {
  update: vi.fn()
};

subject.attach(
  observer
);

subject.detach(
  observer
);

subject.notify(
  'team_finalized',
  {
    projetoId: 'proj-1'
  }
);

expect(
  observer.update
).not.toHaveBeenCalled();

});

it('deve continuar notificando os outros observers após remover um deles', () => {
const subject =
new NotificationSubject();

const observer1: Observer = {
  update: vi.fn()
};

const observer2: Observer = {
  update: vi.fn()
};

subject.attach(
  observer1
);

subject.attach(
  observer2
);

subject.detach(
  observer1
);

subject.notify(
  'team_finalized',
  {
    projetoId: 'proj-1'
  }
);

expect(
  observer1.update
).not.toHaveBeenCalled();

expect(
  observer2.update
).toHaveBeenCalledTimes(1);

});

it('deve executar um listener registrado com on quando o evento for emitido', () => {
const subject =
new NotificationSubject();

const listener = vi.fn();

subject.on(
  'team_finalized',
  listener
);

const data = {
  projetoId: 'proj-1',
  status: 'finalizado'
};

subject.notify(
  'team_finalized',
  data
);

expect(
  listener
).toHaveBeenCalledTimes(1);

expect(
  listener
).toHaveBeenCalledWith(
  data
);

});

it('deve notificar o observer e o listener do EventEmitter no mesmo notify', () => {
const subject =
new NotificationSubject();

const observer: Observer = {
  update: vi.fn()
};

const listener = vi.fn();

subject.attach(
  observer
);

subject.on(
  'team_finalized',
  listener
);

const data = {
  projetoId: 'proj-1'
};

subject.notify(
  'team_finalized',
  data
);

expect(
  observer.update
).toHaveBeenCalledTimes(1);

expect(
  listener
).toHaveBeenCalledTimes(1);

expect(
  observer.update
).toHaveBeenCalledWith(
  'team_finalized',
  data
);

expect(
  listener
).toHaveBeenCalledWith(
  data
);

});

it('não deve executar listener de outro evento', () => {
const subject =
new NotificationSubject();

const listener = vi.fn();

subject.on(
  'team_finalized',
  listener
);

subject.notify(
  'invitation_created',
  {
    projetoId: 'proj-1'
  }
);

expect(
  listener
).not.toHaveBeenCalled();

});
});
