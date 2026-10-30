import { Observer } from './observer';

export class AuditObserver implements Observer {
  private logs: any[] = [];

  update(event: string, data: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };
    this.logs.push(entry);
    console.log(`[AUDIT] ${event}`, entry);
  }

  getLogs() {
    return this.logs;
  }
}