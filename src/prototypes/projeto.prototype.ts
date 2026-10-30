import {
  Projeto,
  PapelObrigatorio,
  CaptureType
} from '../domain/entities.js';

/**
 * Prototype Pattern
 * Interface que garante a capacidade de clonagem profunda de projetos.
 * Cada tipo de projeto (documentário, animação, publicitário) fornece
 * sua própria implementação de clone(), preservando todos os agregados.
 */
export interface ProjetoPrototype extends Projeto {
  /**
   * Retorna uma cópia profunda do projeto, incluindo lista de papéis
   * e quaisquer restrições específicas do tipo.
   */
  clone(): ProjetoPrototype;

  /**
   * Identificador do protótipo registrado (usado pelo registro de protótipos).
   */
  readonly prototypeId: string;
}

/**
 * Classe base abstrata que implementa a lógica comum de clonagem
 * e atua como protótipo inicial para cada família de projetos.
 */
export abstract class ProjetoBase implements ProjetoPrototype {
  id: string;
  genero: string;
  duracaoEstimada: number;
  orcamentoTotal: number;
  dataEntrega: string;
  tipoCaptacao: CaptureType;
  localizacao: string;
  papeis: PapelObrigatorio[];
  estrategia?: 'cosine' | 'collaborative' | 'low-budget';

  abstract readonly prototypeId: string;

  constructor(data: Projeto) {
    this.id = data.id;
    this.genero = data.genero;
    this.duracaoEstimada = data.duracaoEstimada;
    this.orcamentoTotal = data.orcamentoTotal;
    this.dataEntrega = data.dataEntrega;
    this.tipoCaptacao = data.tipoCaptacao;
    this.localizacao = data.localizacao;
    this.papeis = data.papeis.map((p) => ({ ...p }));
    this.estrategia = data.estrategia;
  }

  /**
   * Clonagem profunda: cria nova instância com cópia independente
   * de todos os atributos e agregados (papéis, restrições).
   */
  abstract clone(): ProjetoPrototype;

  /**
   * Método auxiliar para construir o payload de dados para o construtor
   * das subclasses, garantindo deep-copy dos papéis.
   */
  protected toData(): Projeto {
    return {
      id: this.id,
      genero: this.genero,
      duracaoEstimada: this.duracaoEstimada,
      orcamentoTotal: this.orcamentoTotal,
      dataEntrega: this.dataEntrega,
      tipoCaptacao: this.tipoCaptacao,
      localizacao: this.localizacao,
      papeis: this.papeis.map((p) => ({ ...p })),
      estrategia: this.estrategia
    };
  }
}

/**
 * Projeto de Documentário.
 * Papéis típicos: diretor, cinematógrafo, editor, pesquisador, narrador.
 * Restrições: prioriza autenticidade e pesquisa de campo.
 */
export class ProjetoDocumentario extends ProjetoBase {
  readonly prototypeId = 'documentario';

  /** Restrições específicas de documentário */
  restricoes: {
    exigePesquisaCampo: boolean;
    permiteNarracao: boolean;
    orcamentoMinimoPesquisa: number;
  };

  constructor(
    data: Projeto,
    restricoes?: ProjetoDocumentario['restricoes']
  ) {
    super({ ...data, tipoCaptacao: 'documentario' });
    this.restricoes = restricoes ?? {
      exigePesquisaCampo: true,
      permiteNarracao: true,
      orcamentoMinimoPesquisa: 5000
    };
  }

  clone(): ProjetoDocumentario {
    const copia = new ProjetoDocumentario(this.toData(), {
      ...this.restricoes
    });
    // Novo ID para a instância clonada (simula criação a partir do protótipo)
    copia.id = `${this.id}-clone-${Date.now()}`;
    return copia;
  }
}

/**
 * Projeto de Animação.
 * Papéis típicos: diretor de animação, modelador 3D, animador, compositor, editor.
 * Restrições: prioriza skills de software 3D e eficiência de renderização.
 */
export class ProjetoAnimacao extends ProjetoBase {
  readonly prototypeId = 'animacao';

  restricoes: {
    softwarePreferido: string[];
    framesPorSegundo: number;
    exigeRenderFarm: boolean;
  };

  constructor(
    data: Projeto,
    restricoes?: ProjetoAnimacao['restricoes']
  ) {
    super({ ...data, tipoCaptacao: 'animacao' });
    this.restricoes = restricoes ?? {
      softwarePreferido: ['Maya', 'Blender', 'Cinema4D'],
      framesPorSegundo: 24,
      exigeRenderFarm: false
    };
  }

  clone(): ProjetoAnimacao {
    const copia = new ProjetoAnimacao(this.toData(), {
      ...this.restricoes,
      softwarePreferido: [...this.restricoes.softwarePreferido]
    });
    copia.id = `${this.id}-clone-${Date.now()}`;
    return copia;
  }
}

/**
 * Projeto Publicitário (videoclipe / comercial / agência).
 * Papéis típicos: diretor, diretor de fotografia, editor, motion designer, produtor.
 * Restrições: prazos curtos, orçamento por entrega, métricas de conversão.
 */
export class ProjetoPublicitario extends ProjetoBase {
  readonly prototypeId = 'publicitario';

  restricoes: {
    prazoMaximoDias: number;
    exigeMotionDesign: boolean;
    metricasConversao: boolean;
  };

  constructor(
    data: Projeto,
    restricoes?: ProjetoPublicitario['restricoes']
  ) {
    // tipoCaptacao 'ficcao' é reutilizado como base para publicitário
    // (o schema Prisma usa string; o domínio trata 'publicitario' como variante)
    super({
      ...data,
      tipoCaptacao: 'publicitario'
    });
    this.restricoes = restricoes ?? {
      prazoMaximoDias: 30,
      exigeMotionDesign: true,
      metricasConversao: true
    };
  }

  clone(): ProjetoPublicitario {
    const copia = new ProjetoPublicitario(this.toData(), {
      ...this.restricoes
    });
    copia.id = `${this.id}-clone-${Date.now()}`;
    return copia;
  }
}

/**
 * Registro de protótipos (Prototype Registry).
 * Permite registrar modelos pré-configurados e clonar a partir deles.
 */
export class RegistroPrototipos {
  private static prototypes = new Map<string, ProjetoPrototype>();

  static registrar(prototype: ProjetoPrototype): void {
    this.prototypes.set(prototype.prototypeId, prototype);
  }

  static obter(id: string): ProjetoPrototype | undefined {
    return this.prototypes.get(id);
  }

  static clonar(id: string, overrides?: Partial<Projeto>): ProjetoPrototype {
    const proto = this.prototypes.get(id);
    if (!proto) {
      throw new Error(`Protótipo "${id}" não registrado.`);
    }
    const clone = proto.clone();
    if (overrides) {
      if (overrides.genero !== undefined) clone.genero = overrides.genero;
      if (overrides.duracaoEstimada !== undefined)
        clone.duracaoEstimada = overrides.duracaoEstimada;
      if (overrides.orcamentoTotal !== undefined)
        clone.orcamentoTotal = overrides.orcamentoTotal;
      if (overrides.dataEntrega !== undefined)
        clone.dataEntrega = overrides.dataEntrega;
      if (overrides.localizacao !== undefined)
        clone.localizacao = overrides.localizacao;
      if (overrides.papeis !== undefined)
        clone.papeis = overrides.papeis.map((p) => ({ ...p }));
      if (overrides.estrategia !== undefined)
        clone.estrategia = overrides.estrategia;
      if (overrides.id !== undefined) clone.id = overrides.id;
    }
    return clone;
  }

  static listar(): string[] {
    return Array.from(this.prototypes.keys());
  }
}

/**
 * Inicializa protótipos padrão da plataforma CineBridge.
 * Chamado uma vez na inicialização do sistema.
 */
export function inicializarPrototiposPadrao(): void {
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + 6);
  const dataEntrega = baseDate.toISOString().slice(0, 10);

  RegistroPrototipos.registrar(
    new ProjetoDocumentario({
      id: 'proto-documentario',
      genero: 'documentario',
      duracaoEstimada: 90,
      orcamentoTotal: 150000,
      dataEntrega,
      tipoCaptacao: 'documentario',
      localizacao: 'sao paulo',
      papeis: [
        { papel: 'diretor', peso: 1.0 },
        { papel: 'cinematografo', peso: 0.9 },
        { papel: 'editor', peso: 0.8 },
        { papel: 'pesquisador', peso: 0.7 },
        { papel: 'narrador', peso: 0.5 }
      ],
      estrategia: 'cosine'
    })
  );

  RegistroPrototipos.registrar(
    new ProjetoAnimacao({
      id: 'proto-animacao',
      genero: 'animacao',
      duracaoEstimada: 60,
      orcamentoTotal: 300000,
      dataEntrega,
      tipoCaptacao: 'animacao',
      localizacao: 'rio de janeiro',
      papeis: [
        { papel: 'diretor de animacao', peso: 1.0 },
        { papel: 'modelador 3d', peso: 0.95 },
        { papel: 'animador', peso: 0.9 },
        { papel: 'compositor', peso: 0.8 },
        { papel: 'editor', peso: 0.7 }
      ],
      estrategia: 'collaborative'
    })
  );

  RegistroPrototipos.registrar(
    new ProjetoPublicitario({
      id: 'proto-publicitario',
      genero: 'publicitario',
      duracaoEstimada: 15,
      orcamentoTotal: 80000,
      dataEntrega,
      tipoCaptacao: 'publicitario',
      localizacao: 'sao paulo',
      papeis: [
        { papel: 'diretor', peso: 1.0 },
        { papel: 'diretor de fotografia', peso: 0.9 },
        { papel: 'editor', peso: 0.85 },
        { papel: 'motion designer', peso: 0.8 },
        { papel: 'produtor', peso: 0.7 }
      ],
      estrategia: 'low-budget'
    })
  );
}
