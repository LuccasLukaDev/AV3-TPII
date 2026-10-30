import { describe, it, expect, beforeAll } from 'vitest';
import {
  SeletorFabrica,
  FabricaDocumentario,
  FabricaAnimacao,
  FabricaPublicitario,
  FabricaProjeto
} from '../src/factories/fabrica.projeto.js';
import {
  inicializarPrototiposPadrao,
  RegistroPrototipos,
  ProjetoDocumentario,
  ProjetoAnimacao,
  ProjetoPublicitario
} from '../src/prototypes/projeto.prototype.js';
import { DefaultTeamCompositionOrchestrator } from '../src/template/team-composition.orchestrator.js';
import { RecommendationService } from '../src/services/recommendation.service.js';
import { Projeto, Profissional } from '../src/domain/entities.js';

/**
 * Testes de integração ATV2
 *
 * Demonstram que, ao alternar entre diferentes fábricas,
 * o sistema produz recomendações, validações e notificações
 * consistentes com o tipo de projeto, SEM alterar nenhuma
 * linha do orquestrador.
 */

/**
 * Especialidades alinhadas aos nomes dos papéis usados nos testes,
 * pois as Strategies filtram com includes(papel.papel).
 */
const mockProfessionals: Profissional[] = [
  {
    id: 'p1',
    nome: 'Ana Documentarista',
    especialidades: ['diretor', 'pesquisador', 'documentario', 'direção'],
    precoMedio: 8000,
    disponibilidade: [
      { inicio: '2026-01-01', fim: '2027-12-31' }
    ],
    localizacao: 'sao paulo',
    vetorCompetencias: [0.9, 0.8, 0.7, 0.6, 0.5],
    competencias: [
      { nome: 'diretor', nivel: 9 },
      { nome: 'pesquisador', nivel: 8 }
    ],
    historico: ['doc1', 'doc2', 'doc3'],
    avaliacoes: [{ projetoId: 'x', nota: 4.5 }]
  },
  {
    id: 'p2',
    nome: 'Bruno Animador',
    especialidades: [
      'animador',
      'modelador 3d',
      'maya',
      'blender',
      'animacao'
    ],
    precoMedio: 12000,
    disponibilidade: [
      { inicio: '2026-01-01', fim: '2027-12-31' }
    ],
    localizacao: 'rio de janeiro',
    vetorCompetencias: [0.8, 0.9, 0.85, 0.7, 0.6],
    competencias: [
      { nome: 'animador', nivel: 9 },
      { nome: 'modelador 3d', nivel: 8 }
    ],
    historico: ['anim1', 'anim2', 'anim3'],
    avaliacoes: [{ projetoId: 'y', nota: 4.8 }]
  },
  {
    id: 'p3',
    nome: 'Carla Motion',
    especialidades: [
      'motion designer',
      'motion design',
      'after effects',
      'editor'
    ],
    precoMedio: 6000,
    disponibilidade: [
      { inicio: '2026-01-01', fim: '2027-12-31' }
    ],
    localizacao: 'sao paulo',
    vetorCompetencias: [0.7, 0.6, 0.8, 0.9, 0.5],
    competencias: [
      { nome: 'motion designer', nivel: 9 },
      { nome: 'editor', nivel: 8 }
    ],
    historico: ['pub1', 'pub2'],
    avaliacoes: [{ projetoId: 'z', nota: 4.2 }]
  },
  {
    id: 'p4',
    nome: 'Diego Editor',
    especialidades: ['editor', 'edição', 'premiere', 'documentario'],
    precoMedio: 5000,
    disponibilidade: [
      { inicio: '2026-01-01', fim: '2027-12-31' }
    ],
    localizacao: 'sao paulo',
    vetorCompetencias: [0.6, 0.7, 0.8, 0.5, 0.4],
    competencias: [{ nome: 'editor', nivel: 8 }],
    historico: ['edit1'],
    avaliacoes: [{ projetoId: 'w', nota: 4.0 }]
  },
  {
    id: 'p5',
    nome: 'Elena Cineasta',
    especialidades: [
      'cinematografo',
      'cinematografia',
      'diretor de fotografia',
      'diretor'
    ],
    precoMedio: 9000,
    disponibilidade: [
      { inicio: '2026-01-01', fim: '2027-12-31' }
    ],
    localizacao: 'sao paulo',
    vetorCompetencias: [0.85, 0.75, 0.65, 0.55, 0.45],
    competencias: [{ nome: 'cinematografo', nivel: 9 }],
    historico: ['cine1'],
    avaliacoes: [{ projetoId: 'v', nota: 4.6 }]
  }
];

describe('ATV2 — Prototype Pattern', () => {
  beforeAll(() => {
    inicializarPrototiposPadrao();
  });

  it('deve registrar protótipos padrão', () => {
    const lista = RegistroPrototipos.listar();
    expect(lista).toContain('documentario');
    expect(lista).toContain('animacao');
    expect(lista).toContain('publicitario');
  });

  it('deve clonar ProjetoDocumentario com deep copy de papéis e restrições', () => {
    const original = RegistroPrototipos.obter('documentario') as ProjetoDocumentario;
    const clone = original.clone();

    expect(clone).toBeInstanceOf(ProjetoDocumentario);
    expect(clone.id).not.toBe(original.id);
    expect(clone.papeis).not.toBe(original.papeis); // referência diferente
    expect(clone.papeis).toEqual(original.papeis);
    expect(clone.restricoes).not.toBe(original.restricoes);
    expect(clone.restricoes).toEqual(original.restricoes);
    expect(clone.tipoCaptacao).toBe('documentario');
  });

  it('deve clonar ProjetoAnimacao preservando softwarePreferido', () => {
    const original = RegistroPrototipos.obter('animacao') as ProjetoAnimacao;
    const clone = original.clone();

    expect(clone).toBeInstanceOf(ProjetoAnimacao);
    expect(clone.restricoes.softwarePreferido).not.toBe(
      original.restricoes.softwarePreferido
    );
    expect(clone.restricoes.softwarePreferido).toEqual(
      original.restricoes.softwarePreferido
    );
  });

  it('deve clonar ProjetoPublicitario com restrições de prazo', () => {
    const original = RegistroPrototipos.obter(
      'publicitario'
    ) as ProjetoPublicitario;
    const clone = original.clone();

    expect(clone).toBeInstanceOf(ProjetoPublicitario);
    expect(clone.restricoes.exigeMotionDesign).toBe(true);
    expect(clone.restricoes.prazoMaximoDias).toBe(30);
  });

  it('RegistroPrototipos.clonar deve aplicar overrides', () => {
    const clone = RegistroPrototipos.clonar('documentario', {
      id: 'meu-doc-1',
      orcamentoTotal: 200000,
      localizacao: 'curitiba'
    });

    expect(clone.id).toBe('meu-doc-1');
    expect(clone.orcamentoTotal).toBe(200000);
    expect(clone.localizacao).toBe('curitiba');
    expect(clone.tipoCaptacao).toBe('documentario');
  });
});

describe('ATV2 — Abstract Factory + Factory Method', () => {
  beforeAll(() => {
    inicializarPrototiposPadrao();
  });

  it('SeletorFabrica deve retornar fábrica correta por tipo', () => {
    expect(SeletorFabrica.obter('documentario')).toBeInstanceOf(
      FabricaDocumentario
    );
    expect(SeletorFabrica.obter('animacao')).toBeInstanceOf(FabricaAnimacao);
    expect(SeletorFabrica.obter('publicitario')).toBeInstanceOf(
      FabricaPublicitario
    );
  });

  it('cada fábrica deve criar projeto do tipo correto (Factory Method)', () => {
    const fDoc = new FabricaDocumentario();
    const fAnim = new FabricaAnimacao();
    const fPub = new FabricaPublicitario();

    expect(fDoc.criarProjeto()).toBeInstanceOf(ProjetoDocumentario);
    expect(fAnim.criarProjeto()).toBeInstanceOf(ProjetoAnimacao);
    expect(fPub.criarProjeto()).toBeInstanceOf(ProjetoPublicitario);
  });

  it('cada fábrica deve criar validador específico', () => {
    const fDoc = new FabricaDocumentario();
    const fAnim = new FabricaAnimacao();
    const fPub = new FabricaPublicitario();

    const vDoc = fDoc.criarValidador();
    const vAnim = fAnim.criarValidador();
    const vPub = fPub.criarValidador();

    expect((vDoc as any).getTipo()).toBe('documentario');
    expect((vAnim as any).getTipo()).toBe('animacao');
    expect((vPub as any).getTipo()).toBe('publicitario');
  });

  it('cada fábrica deve criar recomendador (Strategy) adequado', () => {
    const fDoc = new FabricaDocumentario();
    const fAnim = new FabricaAnimacao();
    const fPub = new FabricaPublicitario();

    // Apenas verifica que retorna uma strategy válida (não lança)
    expect(fDoc.criarRecomendador()).toBeDefined();
    expect(fAnim.criarRecomendador()).toBeDefined();
    expect(fPub.criarRecomendador()).toBeDefined();
  });

  it('cada fábrica deve criar notificador com observers anexados', () => {
    const fDoc = new FabricaDocumentario();
    const notificador = fDoc.criarNotificador();
    expect(notificador).toBeDefined();
    // notify não deve lançar
    expect(() =>
      notificador.notify('test_event', { ok: true })
    ).not.toThrow();
  });
});

describe('ATV2 — Integração: alternar fábricas sem alterar orquestrador', () => {
  beforeAll(() => {
    inicializarPrototiposPadrao();
  });

  /**
   * Helper: monta orquestrador a partir da fábrica e executa compose.
   * O código do orquestrador é IDÊNTICO para todos os tipos.
   */
  function orquestrarComFabrica(
    fabrica: FabricaProjeto,
    project: Projeto,
    professionals: Profissional[]
  ) {
    const strategy = fabrica.criarRecomendador(project.estrategia);
    const orchestrator = new DefaultTeamCompositionOrchestrator(
      strategy,
      fabrica
    );
    return {
      equipe: orchestrator.compose(project, professionals),
      fabrica: orchestrator.getFabrica(),
      validador: orchestrator.getValidador(),
      notificador: orchestrator.getNotificador()
    };
  }

  it('Documentário: orquestrador usa FabricaDocumentario e produz equipe válida', () => {
    const fabrica = SeletorFabrica.obter('documentario');
    const projeto = fabrica.criarProjeto({
      id: 'doc-int-1',
      orcamentoTotal: 500000,
      dataEntrega: '2027-06-01',
      localizacao: 'sao paulo',
      papeis: [
        { papel: 'diretor', peso: 1 },
        { papel: 'editor', peso: 0.8 },
        { papel: 'cinematografo', peso: 0.9 }
      ]
    });

    const result = orquestrarComFabrica(fabrica, projeto, mockProfessionals);

    expect(result.fabrica?.tipo).toBe('documentario');
    expect(result.validador).toBeDefined();
    expect(result.notificador).toBeDefined();
    expect(result.equipe.projetoId).toBe('doc-int-1');
    expect(result.equipe.recomendacoes.length).toBeGreaterThanOrEqual(1);
    expect(result.equipe.orcamentoEstimado).toBeLessThanOrEqual(
      projeto.orcamentoTotal
    );
  });

  it('Animação: orquestrador usa FabricaAnimacao e produz equipe válida', () => {
    const fabrica = SeletorFabrica.obter('animacao');
    const projeto = fabrica.criarProjeto({
      id: 'anim-int-1',
      orcamentoTotal: 800000,
      dataEntrega: '2027-09-01',
      localizacao: 'rio de janeiro',
      papeis: [
        { papel: 'animador', peso: 1 },
        { papel: 'modelador 3d', peso: 0.95 },
        { papel: 'editor', peso: 0.7 }
      ]
    });

    const result = orquestrarComFabrica(fabrica, projeto, mockProfessionals);

    expect(result.fabrica?.tipo).toBe('animacao');
    expect(result.equipe.projetoId).toBe('anim-int-1');
    expect(result.equipe.recomendacoes.length).toBeGreaterThanOrEqual(1);
  });

  it('Publicitário: orquestrador usa FabricaPublicitario e produz equipe válida', () => {
    const fabrica = SeletorFabrica.obter('publicitario');
    const projeto = fabrica.criarProjeto({
      id: 'pub-int-1',
      orcamentoTotal: 300000,
      dataEntrega: '2027-03-01',
      localizacao: 'sao paulo',
      papeis: [
        { papel: 'diretor', peso: 1 },
        { papel: 'motion designer', peso: 0.8 },
        { papel: 'editor', peso: 0.7 }
      ]
    });

    const result = orquestrarComFabrica(fabrica, projeto, mockProfessionals);

    expect(result.fabrica?.tipo).toBe('publicitario');
    expect(result.equipe.projetoId).toBe('pub-int-1');
    expect(result.equipe.recomendacoes.length).toBeGreaterThanOrEqual(1);
  });

  it('alternar fábricas não exige alteração no código do orquestrador', () => {
    // O mesmo helper (mesmo código de orquestração) funciona para os 3 tipos
    const tipos = ['documentario', 'animacao', 'publicitario'] as const;
    const resultados = tipos.map((tipo) => {
      const fabrica = SeletorFabrica.obter(tipo);
      const projeto = fabrica.criarProjeto({
        id: `test-${tipo}`,
        orcamentoTotal: 999999,
        dataEntrega: '2027-12-01',
        localizacao: 'sao paulo',
        papeis: [
          { papel: 'diretor', peso: 1 },
          { papel: 'editor', peso: 0.8 }
        ]
      });
      return orquestrarComFabrica(fabrica, projeto, mockProfessionals);
    });

    // Cada um usou sua fábrica
    expect(resultados[0].fabrica?.tipo).toBe('documentario');
    expect(resultados[1].fabrica?.tipo).toBe('animacao');
    expect(resultados[2].fabrica?.tipo).toBe('publicitario');

    // Todos produziram equipes
    resultados.forEach((r) => {
      expect(r.equipe.recomendacoes.length).toBeGreaterThanOrEqual(1);
      expect(r.validador).toBeDefined();
      expect(r.notificador).toBeDefined();
    });
  });

  it('validador de documentário detecta ausência de pesquisador', () => {
    const fabrica = SeletorFabrica.obter('documentario');
    const projeto = fabrica.criarProjeto({
      id: 'doc-val',
      orcamentoTotal: 100000,
      dataEntrega: '2027-06-01',
      localizacao: 'sao paulo',
      papeis: [{ papel: 'diretor', peso: 1 }] // sem pesquisador
    });

    const validador = fabrica.criarValidador();
    validador.visitProject(projeto);
    const result = validador.getResult() as {
      valido: boolean;
      issues: string[];
      tipo: string;
    };

    expect(result.tipo).toBe('documentario');
    expect(result.issues.some((i) => i.toLowerCase().includes('pesquisador'))).toBe(
      true
    );
  });

  it('validador de animação detecta ausência de pipeline 3D', () => {
    const fabrica = SeletorFabrica.obter('animacao');
    const projeto = fabrica.criarProjeto({
      id: 'anim-val',
      orcamentoTotal: 200000,
      dataEntrega: '2027-06-01',
      localizacao: 'rio de janeiro',
      papeis: [{ papel: 'produtor', peso: 1 }] // sem 3D
    });

    const validador = fabrica.criarValidador();
    validador.visitProject(projeto);
    const result = validador.getResult() as {
      issues: string[];
      tipo: string;
    };

    expect(result.tipo).toBe('animacao');
    expect(
      result.issues.some((i) => i.toLowerCase().includes('3d') || i.toLowerCase().includes('pipeline'))
    ).toBe(true);
  });
});

describe('ATV2 — RecommendationService com fábricas', () => {
  it('resolverTipoProjeto via serviço (indireto pelo obterFabrica)', () => {
    const service = new RecommendationService();
    expect(service.obterFabrica('documentario').tipo).toBe('documentario');
    expect(service.obterFabrica('animacao').tipo).toBe('animacao');
    expect(service.obterFabrica('publicitario').tipo).toBe('publicitario');
  });

  it('criarProjetoAPartirDePrototipo retorna clone configurável', () => {
    const service = new RecommendationService();
    const projeto = service.criarProjetoAPartirDePrototipo('animacao', {
      id: 'svc-anim-1',
      orcamentoTotal: 450000
    });

    expect(projeto.id).toBe('svc-anim-1');
    expect(projeto.orcamentoTotal).toBe(450000);
    expect(projeto.tipoCaptacao).toBe('animacao');
  });

  it('listarPrototipos retorna os três tipos', () => {
    const service = new RecommendationService();
    const lista = service.listarPrototipos();
    expect(lista).toEqual(
      expect.arrayContaining(['documentario', 'animacao', 'publicitario'])
    );
  });
});
