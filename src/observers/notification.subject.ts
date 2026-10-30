import { Observer } from './observer.js';
import { EventEmitter } from 'events';

/**
 * Subject do padrão Observer + EventEmitter (pronto para evoluir para RabbitMQ)
 */
export class NotificationSubject {
  private observers: Observer[] = [];
  private emitter = new EventEmitter();

  attach(observer: Observer): void {
    this.observers.push(observer);
  }

  detach(observer: Observer): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(event: string, data: any): void {
    // Notifica observadores síncronos
    for (const obs of this.observers) {
      obs.update(event, data);
    }
    // Emite evento assíncrono (pode ser substituído por fila)
    this.emitter.emit(event, data);
  }

  on(event: string, listener: (data: any) => void): void {
    this.emitter.on(event, listener);
  }
}