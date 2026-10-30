import { Projeto, Profissional } from '../domain/entities.js';
import { ProjectVisitor } from '../domain/interfaces.js';
import {
  ProjetoDocumentario,
  ProjetoAnimacao,
  ProjetoPublicitario
} from '../prototypes/projeto.prototype.js';

/**
 * Validador base — verifica regras comuns a todos os tipos de projeto.
 */
export abstract class ValidadorProjetoBase implements ProjectVisitor {
  protected issues: string[] = [];
  protected score = 100;

  visitProject(project: Projeto): void {
    if (project.orcamentoTotal <= 0) {
      this.issues.push('Orçamento deve ser positivo.');
      this.score -= 30;
    }
    if (!project.papeis || project.papeis.length === 0) {
      this.issues.push('Projeto deve possuir ao menos um papel obrigatório.');
      this.score -= 40;
    }
    const delivery = new Date(project.dataEntrega);
    if (Number.isNaN(delivery.getTime()) || delivery < new Date()) {
      this.issues.push('Data de entrega inválida ou já passou.');
      this.score -= 25;
    }
  }

  visitProfessional(_profissional: Profissional, _papel?: string): void {
    // subclasses podem sobrescrever
  }

  getResult(): { valido: boolean; issues: string[]; score: number; tipo: string } {
    return {
      valido: this.issues.length === 0,
      issues: [...this.issues],
      score: Math.max(0, this.score),
      tipo: this.getTipo()
    };
  }

  abstract getTipo(): string;
}

/**
 * Validador específico para Documentário.
 * Verifica restrições de pesquisa de campo e narracão.
 */
export class ValidadorDocumentario extends ValidadorProjetoBase {
  getTipo(): string {
    return 'documentario';
  }

  visitProject(project: Projeto): void {
    super.visitProject(project);

    const doc = project as ProjetoDocumentario;
    if (doc.restricoes?.exigePesquisaCampo) {
      const temPesquisador = project.papeis.some(
        (p) => p.papel.toLowerCase().includes('pesquisador')
      );
      if (!temPesquisador) {
        this.issues.push(
          'Documentário exige papel de pesquisador (pesquisa de campo).'
        );
        this.score -= 20;
      }
    }

    if (
      doc.restricoes?.orcamentoMinimoPesquisa &&
      project.orcamentoTotal < doc.restricoes.orcamentoMinimoPesquisa
    ) {
      this.issues.push(
        `Orçamento insuficiente para pesquisa de campo (mínimo ${doc.restricoes.orcamentoMinimoPesquisa}).`
      );
      this.score -= 15;
    }
  }

  visitProfessional(profissional: Profissional, papel?: string): void {
    if (papel?.toLowerCase().includes('pesquisador')) {
      const temPesquisa = profissional.especialidades.some((e) =>
        e.toLowerCase().includes('pesquisa')
      );
      if (!temPesquisa) {
        this.issues.push(
          `Profissional ${profissional.nome} indicado como pesquisador sem especialidade em pesquisa.`
        );
        this.score -= 10;
      }
    }
  }
}

/**
 * Validador específico para Animação.
 * Verifica skills de software 3D e consistência de FPS.
 */
export class ValidadorAnimacao extends ValidadorProjetoBase {
  getTipo(): string {
    return 'animacao';
  }

  visitProject(project: Projeto): void {
    super.visitProject(project);

    const anim = project as ProjetoAnimacao;
    const papeis3d = ['modelador 3d', 'animador', 'compositor'];
    const tem3d = project.papeis.some((p) =>
      papeis3d.some((r) => p.papel.toLowerCase().includes(r))
    );
    if (!tem3d) {
      this.issues.push(
        'Projeto de animação deve incluir ao menos um papel de pipeline 3D (modelador, animador ou compositor).'
      );
      this.score -= 25;
    }

    if (anim.restricoes?.framesPorSegundo && anim.restricoes.framesPorSegundo < 12) {
      this.issues.push('FPS abaixo de 12 é inadequado para animação profissional.');
      this.score -= 10;
    }
  }

  visitProfessional(profissional: Profissional, papel?: string): void {
    const softwares = ['maya', 'blender', 'cinema4d', 'houdini', 'after effects'];
    const temSoftware = profissional.especialidades.some((e) =>
      softwares.some((s) => e.toLowerCase().includes(s))
    );
    if (
      papel &&
      ['modelador', 'animador', 'compositor'].some((r) =>
        papel.toLowerCase().includes(r)
      ) &&
      !temSoftware
    ) {
      this.issues.push(
        `Profissional ${profissional.nome} (${papel}) sem especialidade em software 3D relevante.`
      );
      this.score -= 15;
    }
  }
}

/**
 * Validador específico para Publicitário.
 * Verifica prazos curtos e presença de motion design.
 */
export class ValidadorPublicitario extends ValidadorProjetoBase {
  getTipo(): string {
    return 'publicitario';
  }

  visitProject(project: Projeto): void {
    super.visitProject(project);

    const pub = project as ProjetoPublicitario;
    if (pub.restricoes?.exigeMotionDesign) {
      const temMotion = project.papeis.some((p) =>
        p.papel.toLowerCase().includes('motion')
      );
      if (!temMotion) {
        this.issues.push(
          'Projeto publicitário exige papel de motion designer.'
        );
        this.score -= 20;
      }
    }

    const delivery = new Date(project.dataEntrega);
    const now = new Date();
    const diffDays = Math.ceil(
      (delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (
      pub.restricoes?.prazoMaximoDias &&
      diffDays > pub.restricoes.prazoMaximoDias * 3
    ) {
      // apenas aviso suave — prazos longos não invalidam
      this.score -= 5;
    }
  }

  visitProfessional(profissional: Profissional, papel?: string): void {
    if (papel?.toLowerCase().includes('motion')) {
      const temMotion = profissional.especialidades.some((e) =>
        e.toLowerCase().includes('motion') ||
        e.toLowerCase().includes('after effects') ||
        e.toLowerCase().includes('design')
      );
      if (!temMotion) {
        this.issues.push(
          `Profissional ${profissional.nome} indicado como motion designer sem especialidade compatível.`
        );
        this.score -= 10;
      }
    }
  }
}
