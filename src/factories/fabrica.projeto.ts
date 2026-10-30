import { Projeto } from '../domain/entities.js';
import { ProjectVisitor } from '../domain/interfaces.js';
import { RecommendationStrategy } from '../strategies/recommendation.strategy.js';
import { CosineSimilarityStrategy } from '../strategies/cosine.strategy.js';
import { CollaborativeFilteringStrategy } from '../strategies/colaborative.strategy.js';
import { LowBudgetRulesStrategy } from '../strategies/low-budget.strategy.js';
import { NotificationSubject } from '../observers/notification.subject.js';
import { AuditObserver } from '../observers/audit.observer.js';
import { EmailObserver } from '../observers/email.observer.js';
import {
  ProjetoDocumentario,
  ProjetoAnimacao,
  ProjetoPublicitario,
  ProjetoPrototype,
  RegistroPrototipos
} from '../prototypes/projeto.prototype.js';
import {
  ValidadorDocumentario,
  ValidadorAnimacao,
  ValidadorPublicitario
} from '../validators/project.validators.js';

/**
 * Abstract Factory — FabricaProjeto
 *
 * Define a interface para criar famílias de objetos relacionados a um
 * tipo de projeto: o próprio projeto (via Prototype), o validador,
 * o recomendador (Strategy) e o notificador (Observer).
 *
 * Cada fábrica concreta garante que os objetos produzidos cooperam
 * entre si, eliminando condicionais espalhados pelo orquestrador.
 */
export interface FabricaProjeto {
  readonly tipo: string;

  /**
   * Cria (ou clona a partir do protótipo) um projeto do tipo desta fábrica.
   * Factory Method interno.
   */
  criarProjeto(dados?: Partial<Projeto>): ProjetoPrototype;

  /**
   * Cria o validador específico do tipo de projeto.
   */
  criarValidador(): ProjectVisitor;

  /**
   * Cria o recomendador (Strategy) adequado ao tipo de projeto.
   * Pode receber override de estratégia se o cliente solicitar.
   */
  criarRecomendador(
    estrategiaOverride?: Projeto['estrategia']
  ): RecommendationStrategy;

  /**
   * Cria o notificador (Subject + observers) configurado para o tipo.
   */
  criarNotificador(): NotificationSubject;
}

/**
 * Fábrica concreta para Documentário.
 * - Projeto: ProjetoDocumentario (Prototype)
 * - Validador: ValidadorDocumentario
 * - Recomendador: CosineSimilarity (prioriza similaridade de competências)
 * - Notificador: Audit + Email
 */
export class FabricaDocumentario implements FabricaProjeto {
  readonly tipo = 'documentario';

  criarProjeto(dados?: Partial<Projeto>): ProjetoDocumentario {
    if (dados && Object.keys(dados).length > 0) {
      const base = RegistroPrototipos.clonar('documentario', dados);
      return base as ProjetoDocumentario;
    }
    // clona o protótipo puro
    return RegistroPrototipos.clonar('documentario') as ProjetoDocumentario;
  }

  criarValidador(): ProjectVisitor {
    return new ValidadorDocumentario();
  }

  criarRecomendador(
    estrategiaOverride?: Projeto['estrategia']
  ): RecommendationStrategy {
    const estrategia = estrategiaOverride ?? 'cosine';
    switch (estrategia) {
      case 'collaborative':
        return new CollaborativeFilteringStrategy();
      case 'low-budget':
        return new LowBudgetRulesStrategy();
      case 'cosine':
      default:
        return new CosineSimilarityStrategy();
    }
  }

  criarNotificador(): NotificationSubject {
    const subject = new NotificationSubject();
    subject.attach(new AuditObserver());
    subject.attach(new EmailObserver());
    return subject;
  }
}

/**
 * Fábrica concreta para Animação.
 * - Projeto: ProjetoAnimacao
 * - Validador: ValidadorAnimacao
 * - Recomendador: Collaborative (prioriza histórico e colaboração em pipelines 3D)
 * - Notificador: Audit + Email
 */
export class FabricaAnimacao implements FabricaProjeto {
  readonly tipo = 'animacao';

  criarProjeto(dados?: Partial<Projeto>): ProjetoAnimacao {
    if (dados && Object.keys(dados).length > 0) {
      return RegistroPrototipos.clonar('animacao', dados) as ProjetoAnimacao;
    }
    return RegistroPrototipos.clonar('animacao') as ProjetoAnimacao;
  }

  criarValidador(): ProjectVisitor {
    return new ValidadorAnimacao();
  }

  criarRecomendador(
    estrategiaOverride?: Projeto['estrategia']
  ): RecommendationStrategy {
    const estrategia = estrategiaOverride ?? 'collaborative';
    switch (estrategia) {
      case 'cosine':
        return new CosineSimilarityStrategy();
      case 'low-budget':
        return new LowBudgetRulesStrategy();
      case 'collaborative':
      default:
        return new CollaborativeFilteringStrategy();
    }
  }

  criarNotificador(): NotificationSubject {
    const subject = new NotificationSubject();
    subject.attach(new AuditObserver());
    subject.attach(new EmailObserver());
    return subject;
  }
}

/**
 * Fábrica concreta para Publicitário.
 * - Projeto: ProjetoPublicitario
 * - Validador: ValidadorPublicitario
 * - Recomendador: LowBudget (prazos curtos e orçamento apertado)
 * - Notificador: Audit + Email
 */
export class FabricaPublicitario implements FabricaProjeto {
  readonly tipo = 'publicitario';

  criarProjeto(dados?: Partial<Projeto>): ProjetoPublicitario {
    if (dados && Object.keys(dados).length > 0) {
      return RegistroPrototipos.clonar(
        'publicitario',
        dados
      ) as ProjetoPublicitario;
    }
    return RegistroPrototipos.clonar(
      'publicitario'
    ) as ProjetoPublicitario;
  }

  criarValidador(): ProjectVisitor {
    return new ValidadorPublicitario();
  }

  criarRecomendador(
    estrategiaOverride?: Projeto['estrategia']
  ): RecommendationStrategy {
    const estrategia = estrategiaOverride ?? 'low-budget';
    switch (estrategia) {
      case 'cosine':
        return new CosineSimilarityStrategy();
      case 'collaborative':
        return new CollaborativeFilteringStrategy();
      case 'low-budget':
      default:
        return new LowBudgetRulesStrategy();
    }
  }

  criarNotificador(): NotificationSubject {
    const subject = new NotificationSubject();
    subject.attach(new AuditObserver());
    subject.attach(new EmailObserver());
    return subject;
  }
}

/**
 * Registry / seletor de fábricas.
 * Permite obter a fábrica adequada a partir do tipo de projeto
 * sem condicionais no orquestrador ou no serviço.
 */
export class SeletorFabrica {
  private static factories = new Map<string, FabricaProjeto>([
    ['documentario', new FabricaDocumentario()],
    ['animacao', new FabricaAnimacao()],
    ['publicitario', new FabricaPublicitario()],
    // aliases comuns
    ['ficcao', new FabricaPublicitario()],
    ['videoclipe', new FabricaPublicitario()],
    ['comercial', new FabricaPublicitario()]
  ]);

  static obter(tipo: string): FabricaProjeto {
    const key = tipo.toLowerCase().trim();
    const fabrica = this.factories.get(key);
    if (!fabrica) {
      // fallback seguro: documentário
      return this.factories.get('documentario')!;
    }
    return fabrica;
  }

  static registrar(tipo: string, fabrica: FabricaProjeto): void {
    this.factories.set(tipo.toLowerCase().trim(), fabrica);
  }

  static listar(): string[] {
    return Array.from(this.factories.keys());
  }
}
