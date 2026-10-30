import { ProjectVisitor } from './visitor.js';
import { Projeto, Profissional } from '../domain/entities.js';

export class ConsistencyVisitor implements ProjectVisitor {
  private missingRoles: string[] = [];
  private budgetOk = true;
  private totalCost = 0;

  visitProject(project: Projeto): void {
    this.missingRoles = [];
    this.budgetOk = true;
    this.totalCost = 0;
  }

  visitProfessional(profissional: Profissional, papel?: string): void {
    if (papel) {
      this.totalCost += profissional.precoMedio;
    }
  }

  // Chamado após visitar todos
  check(project: Projeto, selected: { papel: string; profissional: Profissional }[]): void {
    const selectedRoles = new Set(selected.map(s => s.papel));
    for (const p of project.papeis) {
      if (!selectedRoles.has(p.papel)) {
        this.missingRoles.push(p.papel);
      }
    }
    this.budgetOk = this.totalCost <= project.orcamentoTotal;
  }

  getResult() {
    return {
      consistent: this.missingRoles.length === 0 && this.budgetOk,
      missingRoles: this.missingRoles,
      budgetOk: this.budgetOk,
      totalCost: this.totalCost
    };
  }
}