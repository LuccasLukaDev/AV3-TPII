import {
  Projeto,
  EquipeSugerida,
  Profissional,
  Recomendacao
} from '../domain/entities.js';

import { ProfessionalRepository } from '../repositories/professional.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';

import { CosineSimilarityStrategy } from '../strategies/cosine.strategy.js';
import { CollaborativeFilteringStrategy } from '../strategies/colaborative.strategy.js';
import { LowBudgetRulesStrategy } from '../strategies/low-budget.strategy.js';
import { RecommendationStrategy } from '../strategies/recommendation.strategy.js';

import { DefaultTeamCompositionOrchestrator } from '../template/team-composition.orchestrator.js';

import { NotificationSubject } from '../observers/notification.subject.js';
import { AuditObserver } from '../observers/audit.observer.js';

import { ConsistencyVisitor } from '../visitors/consistency.visitor.js';
import { CompatibilityVisitor } from '../visitors/compatibility.visitor.js';
import { ReportVisitor } from '../visitors/report.visitor.js';

import {
  SeletorFabrica,
  FabricaProjeto
} from '../factories/fabrica.projeto.js';
import {
  inicializarPrototiposPadrao,
  RegistroPrototipos
} from '../prototypes/projeto.prototype.js';

import {
  AdaptadorArmazenamento,
  AdaptadorPagamento,
  AdaptadorProfissional
} from '../adapters/adaptador.interfaces.js';
import { ServicoProjeto } from '../composite/servico-projeto.js';
import {
  CacheDecorator,
  AuditoriaDecorator,
  CompressaoDecorator,
  criarPilhaDecoradores
} from '../decorators/recomendacao.decorators.js';

inicializarPrototiposPadrao();

export class RecommendationService {
  private adaptadorArmazenamento?: AdaptadorArmazenamento;
  private adaptadorPagamento?: AdaptadorPagamento;
  private adaptadorProfissional?: AdaptadorProfissional;
  private decoratorOptions: { cache?: boolean; auditoria?: boolean; compressao?: boolean; cacheTtlMs?: number } = {
    cache: true,
    auditoria: true,
    compressao: false
  };

  constructor(
    private readonly repo: ProfessionalRepository = new ProfessionalRepository(),
    private readonly projectRepository: ProjectRepository = new ProjectRepository(),
    private readonly subject: NotificationSubject = new NotificationSubject(),
    private readonly audit: AuditObserver = new AuditObserver(),
    adaptadorArmazenamento?: AdaptadorArmazenamento,
    adaptadorPagamento?: AdaptadorPagamento,
    adaptadorProfissional?: AdaptadorProfissional
  ) {
    this.adaptadorArmazenamento = adaptadorArmazenamento;
    this.adaptadorPagamento = adaptadorPagamento;
    this.adaptadorProfissional = adaptadorProfissional;
  }

  configurarAdaptadores(opts: {
    armazenamento?: AdaptadorArmazenamento;
    pagamento?: AdaptadorPagamento;
    profissional?: AdaptadorProfissional;
  }): void {
    if (opts.armazenamento) this.adaptadorArmazenamento = opts.armazenamento;
    if (opts.pagamento) this.adaptadorPagamento = opts.pagamento;
    if (opts.profissional) this.adaptadorProfissional = opts.profissional;
  }

  configurarDecoradores(opts: {
    cache?: boolean;
    auditoria?: boolean;
    compressao?: boolean;
    cacheTtlMs?: number;
  }): void {
    this.decoratorOptions = { ...this.decoratorOptions, ...opts };
  }

  getAdaptadorArmazenamento(): AdaptadorArmazenamento | undefined {
    return this.adaptadorArmazenamento;
  }

  getAdaptadorPagamento(): AdaptadorPagamento | undefined {
    return this.adaptadorPagamento;
  }

  getAdaptadorProfissional(): AdaptadorProfissional | undefined {
    return this.adaptadorProfissional;
  }

  calcularCustoTotalProjeto(project: Projeto): number {
    if (project.servicoPrincipal) {
      return project.servicoPrincipal.calcularCusto();
    }
    return project.orcamentoTotal;
  }

  validarServicosProjeto(project: Projeto): boolean {
    if (project.servicoPrincipal) {
      return project.servicoPrincipal.validar();
    }
    return project.papeis.length > 0;
  }

  obterPrazoProjeto(project: Projeto): number {
    if (project.servicoPrincipal) {
      return project.servicoPrincipal.obterPrazo();
    }
    return project.duracaoEstimada;
  }

  async uploadMidia(arquivo: Buffer, caminho: string): Promise<string> {
    if (!this.adaptadorArmazenamento) {
      throw new Error('Adaptador de armazenamento não configurado');
    }
    return this.adaptadorArmazenamento.upload(arquivo, caminho);
  }

  async processarPagamento(valor: number, moeda: string, descricao: string): Promise<{ id: string; status: string; valor: number }> {
    if (!this.adaptadorPagamento) {
      throw new Error('Adaptador de pagamento não configurado');
    }
    return this.adaptadorPagamento.processarPagamento(valor, moeda, descricao);
  }

  async buscarProfissionaisExternos(filtros: {
    especialidades?: string[];
    localizacao?: string;
    precoMaximo?: number;
  }): Promise<Array<{ id: string; nome: string; especialidades: string[]; precoMedio: number; fonte: string }>> {
    if (!this.adaptadorProfissional) {
      throw new Error('Adaptador de profissional não configurado');
    }
    return this.adaptadorProfissional.buscarProfissionais(filtros);
  }

  aplicarDecoradores(strategy: RecommendationStrategy): RecommendationStrategy {
    return criarPilhaDecoradores(strategy, this.decoratorOptions);
  }

  /**
   * Identifica o tipo de projeto e seleciona a fábrica adequada
   * (Abstract Factory). A fábrica cria o ecossistema completo:
   * estratégia, validador e notificador. O orquestrador recebe
   * a fábrica e opera sem condicionais de tipo.
   */
  async recommend(
    project: Projeto,
    excludedProfessionalIds: string[] = []
  ): Promise<{
    equipe: EquipeSugerida;
    consistency: any;
    compatibility: any;
    report: string;
    fabricaTipo?: string;
    validacaoFabrica?: any;
  }> {
    const professionals = await this.getEligibleProfessionals(
      project,
      excludedProfessionalIds
    );

    if (professionals.length === 0) {
      throw new Error(
        'Nenhum profissional elegível foi encontrado para o projeto.'
      );
    }

    // 1. Seleciona a fábrica pelo tipo de captação / gênero
    const tipo = this.resolverTipoProjeto(project);
    const fabrica = SeletorFabrica.obter(tipo);

    // 2. Cria o recomendador a partir da fábrica (respeitando override de estratégia)
    let strategy = fabrica.criarRecomendador(project.estrategia);
    strategy = this.aplicarDecoradores(strategy);

    const orchestrator = new DefaultTeamCompositionOrchestrator(
      strategy,
      fabrica
    );
    const equipe = orchestrator.compose(project, professionals);

    await this.projectRepository.saveRecommendationResult(project, equipe);

    // Notificação via subject do serviço (compatibilidade) + notificador da fábrica
    this.subject.notify('recommendation_generated', {
      projetoId: project.id,
      equipe,
      tipoFabrica: fabrica.tipo
    });

    // Visitors existentes (comportamentais) — mantidos
    const consistency = new ConsistencyVisitor();
    const compatibility = new CompatibilityVisitor();
    const report = new ReportVisitor();

    consistency.visitProject(project);
    compatibility.visitProject(project);
    report.visitProject(project);

    for (const rec of equipe.recomendacoes) {
      consistency.visitProfessional(rec.profissional, rec.papel);
      compatibility.visitProfessional(rec.profissional);
      report.visitProfessional(rec.profissional, rec.papel);
    }

    consistency.check(
      project,
      equipe.recomendacoes.map((r) => ({
        papel: r.papel,
        profissional: r.profissional
      }))
    );

    // Validação adicional via validador da fábrica
    const validador = fabrica.criarValidador();
    validador.visitProject(project);
    for (const rec of equipe.recomendacoes) {
      validador.visitProfessional(rec.profissional, rec.papel);
    }

    return {
      equipe,
      consistency: consistency.getResult(),
      compatibility: compatibility.getResult(),
      report: report.getResult(),
      fabricaTipo: fabrica.tipo,
      validacaoFabrica: validador.getResult()
    };
  }

  async recommendForRole(
    project: Projeto,
    papel: string,
    excludedProfessionalIds: string[] = []
  ): Promise<Recomendacao> {
    const normalizedRole = this.normalizeText(papel);

    const roleProject: Projeto = {
      ...project,
      papeis: project.papeis.filter(
        (item) => this.normalizeText(item.papel) === normalizedRole
      )
    };

    if (roleProject.papeis.length === 0) {
      throw new Error(`O papel "${papel}" não existe no projeto.`);
    }

    const professionals = await this.getEligibleProfessionals(
      roleProject,
      excludedProfessionalIds
    );

    if (professionals.length === 0) {
      throw new Error(
        `Nenhum profissional elegível foi encontrado para o papel "${papel}".`
      );
    }

    const tipo = this.resolverTipoProjeto(roleProject);
    const fabrica = SeletorFabrica.obter(tipo);
    let strategy = fabrica.criarRecomendador(roleProject.estrategia);
    strategy = this.aplicarDecoradores(strategy);

    const orchestrator = new DefaultTeamCompositionOrchestrator(
      strategy,
      fabrica
    );
    const equipe = orchestrator.compose(roleProject, professionals);

    const recommendation = equipe.recomendacoes.find(
      (item) => this.normalizeText(item.papel) === normalizedRole
    );

    if (!recommendation) {
      throw new Error(
        `Não foi possível gerar uma nova recomendação para "${papel}".`
      );
    }

    await this.projectRepository.saveRecommendationForRole(
      project.id,
      normalizedRole,
      recommendation
    );

    this.subject.notify('recommendation_replaced', {
      projetoId: project.id,
      papel: normalizedRole,
      recomendacao: recommendation,
      tipoFabrica: fabrica.tipo
    });

    return recommendation;
  }

  /**
   * Cria um novo projeto a partir de um protótipo registrado (Prototype).
   * Útil para o endpoint de cadastro rápido de projetos.
   */
  criarProjetoAPartirDePrototipo(
    prototypeId: string,
    overrides?: Partial<Projeto>
  ): Projeto {
    return RegistroPrototipos.clonar(prototypeId, overrides);
  }

  /**
   * Lista os protótipos disponíveis.
   */
  listarPrototipos(): string[] {
    return RegistroPrototipos.listar();
  }

  /**
   * Obtém a fábrica para um tipo (exposto para testes de integração).
   */
  obterFabrica(tipo: string): FabricaProjeto {
    return SeletorFabrica.obter(tipo);
  }

  getAuditLogs() {
    return this.audit.getLogs();
  }

  getNotificationSubject() {
    return this.subject;
  }

  /**
   * Resolve o tipo de projeto a partir de tipoCaptacao ou genero.
   */
  private resolverTipoProjeto(project: Projeto): string {
    const captacao = (project.tipoCaptacao || '').toLowerCase().trim();
    const genero = (project.genero || '').toLowerCase().trim();

    if (
      captacao === 'documentario' ||
      genero.includes('documentario') ||
      genero.includes('documentário')
    ) {
      return 'documentario';
    }
    if (
      captacao === 'animacao' ||
      genero.includes('animacao') ||
      genero.includes('animação')
    ) {
      return 'animacao';
    }
    if (
      captacao === 'publicitario' ||
      genero.includes('publicitario') ||
      genero.includes('publicitário') ||
      genero.includes('videoclipe') ||
      genero.includes('comercial') ||
      captacao === 'ficcao'
    ) {
      return 'publicitario';
    }
    // fallback
    return captacao || genero || 'documentario';
  }

  /** @deprecated Mantido para compatibilidade; preferir fábrica. */
  private createStrategy(
    estrategia: Projeto['estrategia']
  ): RecommendationStrategy {
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

  private async getEligibleProfessionals(
    project: Projeto,
    excludedProfessionalIds: string[]
  ): Promise<Profissional[]> {
    const professionals = await this.repo.findAll();
    const excluded = new Set(excludedProfessionalIds);
    const delivery = new Date(project.dataEntrega);

    const available = professionals.filter((professional) => {
      if (excluded.has(professional.id)) {
        return false;
      }

      if (professional.disponibilidade.length === 0) {
        return false;
      }

      return professional.disponibilidade.some((period) => {
        const inicio = new Date(period.inicio);
        const fim = new Date(period.fim);
        return inicio <= delivery && delivery <= fim;
      });
    });

    const projectLocation = this.normalizeText(project.localizacao);

    const sameLocation = available.filter(
      (professional) =>
        this.normalizeText(professional.localizacao) === projectLocation
    );

    const otherLocations = available.filter(
      (professional) =>
        this.normalizeText(professional.localizacao) !== projectLocation
    );

    return [...sameLocation, ...otherLocations];
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
