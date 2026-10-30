import {
  Projeto,
  Profissional,
  Recomendacao,
  EquipeSugerida
} from '../domain/entities.js';

import { RecommendationStrategy } from '../strategies/recommendation.strategy.js';
import { FabricaProjeto } from '../factories/fabrica.projeto.js';
import { ProjectVisitor } from '../domain/interfaces.js';
import { NotificationSubject } from '../observers/notification.subject.js';

/**
 * Template Method — TeamCompositionOrchestrator
 *
 * Agora recebe opcionalmente uma FabricaProjeto (Abstract Factory).
 * Quando a fábrica é fornecida, o orquestrador obtém estratégia,
 * validador e notificador a partir dela, eliminando condicionais
 * baseadas no tipo de projeto.
 *
 * O fluxo do Template Method permanece invariável:
 *   normalize → validate → applyStrategy → postProcess
 */
export abstract class TeamCompositionOrchestrator {
  protected strategy: RecommendationStrategy;
  protected fabrica?: FabricaProjeto;
  protected validador?: ProjectVisitor;
  protected notificador?: NotificationSubject;

  constructor(
    strategy: RecommendationStrategy,
    fabrica?: FabricaProjeto
  ) {
    this.strategy = strategy;
    this.fabrica = fabrica;

    if (fabrica) {
      // Obtém objetos da família a partir da fábrica
      // (não cria o projeto aqui — o projeto já vem do cliente)
      this.validador = fabrica.criarValidador();
      this.notificador = fabrica.criarNotificador();
      // A estratégia já pode ter vindo da fábrica; se não, usa a injetada
      if (!strategy) {
        this.strategy = fabrica.criarRecomendador();
      }
    }
  }

  /**
   * Método template — sequência fixa de passos.
   */
  public compose(
    project: Projeto,
    professionals: Profissional[]
  ): EquipeSugerida {
    const normalized = this.normalizeInput(project);

    // Validação via validador da fábrica (se disponível) + regras base
    this.validateBudgetAndDeadline(normalized, professionals);
    if (this.validador) {
      this.validador.visitProject(normalized);
      const result = this.validador.getResult() as {
        valido: boolean;
        issues: string[];
      };
      if (result && !result.valido && result.issues?.length > 0) {
        // Emite aviso, mas não bloqueia (validação soft na orquestração)
        console.warn(
          `[Validador ${this.fabrica?.tipo ?? 'genérico'}]`,
          result.issues.join('; ')
        );
      }
    }

    const ranked = this.applyStrategy(normalized, professionals);
    const finalTeam = this.postProcess(ranked, normalized);

    // Notificação via notificador da fábrica
    if (this.notificador) {
      this.notificador.notify('team_composed', {
        projetoId: project.id,
        tipo: this.fabrica?.tipo,
        equipe: finalTeam
      });
    }

    return finalTeam;
  }

  protected normalizeInput(project: Projeto): Projeto {
    return {
      ...project,
      genero: project.genero.toLowerCase().trim(),
      localizacao: project.localizacao.toLowerCase().trim(),
      papeis: project.papeis.map((p) => ({
        ...p,
        papel: p.papel.toLowerCase().trim()
      }))
    };
  }

  protected validateBudgetAndDeadline(
    project: Projeto,
    professionals: Profissional[]
  ): void {
    if (project.orcamentoTotal <= 0) {
      throw new Error('Orçamento deve ser positivo.');
    }

    if (professionals.length === 0) {
      throw new Error(
        'Nenhum profissional disponível para avaliação.'
      );
    }

    const delivery = new Date(project.dataEntrega);

    if (Number.isNaN(delivery.getTime())) {
      throw new Error('Data de entrega inválida.');
    }

    if (delivery < new Date()) {
      throw new Error('Data de entrega já passou.');
    }
  }

  protected applyStrategy(
    project: Projeto,
    professionals: Profissional[]
  ): Recomendacao[] {
    return this.strategy.recommend(project, professionals);
  }

  protected postProcess(
    recomendacoes: Recomendacao[],
    project: Projeto
  ): EquipeSugerida {
    const bestByRole = new Map<string, Recomendacao>();

    for (const recommendation of recomendacoes) {
      const current = bestByRole.get(recommendation.papel);

      if (!current || recommendation.score > current.score) {
        bestByRole.set(recommendation.papel, recommendation);
      }
    }

    const finalRecs = Array.from(bestByRole.values());

    console.log(
      'RECOMENDAÇÕES SELECIONADAS:',
      finalRecs.map((r) => ({
        papel: r.papel,
        profissional: r.profissional.nome,
        preco: r.profissional.precoMedio,
        score: r.score
      }))
    );

    const normalizedRoles = project.papeis.map((p) =>
      p.papel.toLowerCase().trim()
    );

    const selectedRoles = new Set(
      finalRecs.map((r) => r.papel.toLowerCase().trim())
    );

    const missingRoles = normalizedRoles.filter(
      (role) => !selectedRoles.has(role)
    );

    if (missingRoles.length > 0) {
      throw new Error(
        `Não foi possível preencher os papéis: ${missingRoles.join(', ')}.`
      );
    }

    const orcamentoEstimado = finalRecs.reduce(
      (sum, recommendation) =>
        sum + recommendation.profissional.precoMedio,
      0
    );

    if (orcamentoEstimado > project.orcamentoTotal) {
      throw new Error(
        `A equipe estimada (${orcamentoEstimado.toFixed(2)}) ultrapassa o orçamento do projeto (${project.orcamentoTotal.toFixed(2)}).`
      );
    }

    const scoreGeral =
      finalRecs.reduce(
        (sum, recommendation) => sum + recommendation.score,
        0
      ) / (finalRecs.length || 1);

    return {
      projetoId: project.id,
      recomendacoes: finalRecs,
      scoreGeral,
      orcamentoEstimado
    };
  }

  /** Expõe a fábrica injetada (útil para testes e auditoria). */
  getFabrica(): FabricaProjeto | undefined {
    return this.fabrica;
  }

  getValidador(): ProjectVisitor | undefined {
    return this.validador;
  }

  getNotificador(): NotificationSubject | undefined {
    return this.notificador;
  }
}

/**
 * Implementação concreta padrão.
 * Pode ser construída apenas com Strategy (compatibilidade retroativa)
 * ou com Strategy + FabricaProjeto (novo fluxo ATV2).
 */
export class DefaultTeamCompositionOrchestrator extends TeamCompositionOrchestrator {
  constructor(strategy: RecommendationStrategy, fabrica?: FabricaProjeto) {
    super(strategy, fabrica);
  }
}
