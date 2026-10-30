import { ProjectVisitor } from './visitor.js';
import { Projeto, Profissional } from '../domain/entities.js';

export class ReportVisitor implements ProjectVisitor {
  private lines: string[] = [];

  visitProject(project: Projeto): void {
    this.lines = [];
    this.lines.push(`=== Relatório do Projeto ${project.id} ===`);
    this.lines.push(`Gênero: ${project.genero} | Orçamento: R$ ${project.orcamentoTotal}`);
    this.lines.push(`Tipo: ${project.tipoCaptacao} | Entrega: ${project.dataEntrega}`);
    this.lines.push('--- Equipe ---');
  }

  visitProfessional(profissional: Profissional, papel?: string): void {
    this.lines.push(
      `${papel ?? 'Profissional'}: ${profissional.nome} (R$ ${profissional.precoMedio}) - ${profissional.localizacao}`
    );
  }

  getResult() {
    return this.lines.join('\n');
  }
}