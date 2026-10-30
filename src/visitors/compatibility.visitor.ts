import { ProjectVisitor } from './visitor.js';
import { Projeto, Profissional } from '../domain/entities.js';

export class CompatibilityVisitor implements ProjectVisitor {
  private scores: number[] = [];

  visitProject(_project: Projeto): void {
    this.scores = [];
  }

  visitProfessional(profissional: Profissional): void {
    const avg = profissional.avaliacoes.length
      ? profissional.avaliacoes.reduce((s, a) => s + a.nota, 0) / profissional.avaliacoes.length
      : 3;
    this.scores.push(avg / 5);
  }

  getResult() {
    const avg = this.scores.length
      ? this.scores.reduce((a, b) => a + b, 0) / this.scores.length
      : 0;
    return { compatibilityScore: avg };
  }
}