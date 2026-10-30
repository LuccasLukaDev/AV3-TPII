import { Observer } from './observer';

export class EmailObserver implements Observer {
  update(event: string, data: any): void {
    console.log(`[EMAIL] Evento: ${event}`, JSON.stringify(data, null, 2));
    // Aqui você integraria com SendGrid, SES, etc.
  }
}