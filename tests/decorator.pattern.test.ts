import { describe, it, expect, beforeEach } from 'vitest';
import {
  CacheDecorator,
  AuditoriaDecorator,
  CompressaoDecorator,
  criarPilhaDecoradores
} from '../src/decorators/recomendacao.decorators.js';
import { CosineSimilarityStrategy } from '../src/strategies/cosine.strategy.js';
import { RecommendationStrategy } from '../src/domain/interfaces.js';
import { Projeto, Profissional, Recomendacao } from '../src/domain/entities.js';
import { RecommendationService } from '../src/services/recommendation.service.js';

const baseProject: Projeto = {
  id: 'proj-dec-1',
  genero: 'documentario',
  duracaoEstimada: 30,
  orcamentoTotal: 40000,
  dataEntrega: '2026-11-15',
  tipoCaptacao: 'documentario',
  localizacao: 'São Paulo',
  papeis: [
    { papel: 'diretor', peso: 1 },
    { papel: 'editor', peso: 0.8 }
  ],
  estrategia: 'cosine'
};

const professionals: Profissional[] = [
  {
    id: 'prof-1',
    nome: 'Alice',
    especialidades: ['diretor', 'documentario'],
    precoMedio: 500,
    disponibilidade: [{ inicio: '2026-01-01', fim: '2027-01-01' }],
    localizacao: 'São Paulo',
    vetorCompetencias: [0.9, 0.8, 0.7],
    competencias: [{ nome: 'direcao', nivel: 5 }],
    historico: [],
    avaliacoes: []
  },
  {
    id: 'prof-2',
    nome: 'Bob',
    especialidades: ['editor'],
    precoMedio: 300,
    disponibilidade: [{ inicio: '2026-01-01', fim: '2027-01-01' }],
    localizacao: 'São Paulo',
    vetorCompetencias: [0.7, 0.9, 0.6],
    competencias: [{ nome: 'edicao', nivel: 4 }],
    historico: [],
    avaliacoes: []
  }
];

class FakeStrategy implements RecommendationStrategy {
  callCount = 0;
  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[] {
    this.callCount++;
    return professionals.map((p, i) => ({
      papel: project.papeis[i % project.papeis.length].papel,
      profissional: p,
      score: 0.9 - i * 0.1,
      motivo: 'fake'
    }));
  }
}

describe('Decorator Pattern - Cache', () => {
  it('CacheDecorator evita recomputação em chamadas repetidas', () => {
    const base = new FakeStrategy();
    const cached = new CacheDecorator(base, 60000);
    const r1 = cached.recommend(baseProject, professionals);
    const r2 = cached.recommend(baseProject, professionals);
    expect(base.callCount).toBe(1);
    expect(r1).toEqual(r2);
    expect(cached.getCacheSize()).toBe(1);
  });

  it('Cache expira após TTL', async () => {
    const base = new FakeStrategy();
    const cached = new CacheDecorator(base, 50);
    cached.recommend(baseProject, professionals);
    await new Promise(r => setTimeout(r, 60));
    cached.recommend(baseProject, professionals);
    expect(base.callCount).toBe(2);
  });
});

describe('Decorator Pattern - Auditoria', () => {
  it('AuditoriaDecorator registra chamadas e tempo', () => {
    const base = new FakeStrategy();
    const audit = new AuditoriaDecorator(base);
    audit.recommend(baseProject, professionals);
    audit.recommend(baseProject, professionals);
    const logs = audit.obterLogs();
    expect(logs.length).toBe(2);
    expect(logs[0].projetoId).toBe('proj-dec-1');
    expect(logs[0].quantidadeProfissionais).toBe(2);
    expect(logs[0].tempoMs).toBeGreaterThanOrEqual(0);
  });
});

describe('Decorator Pattern - Compressão', () => {
  it('CompressaoDecorator calcula métricas de tamanho', () => {
    const base = new FakeStrategy();
    const comp = new CompressaoDecorator(base);
    comp.recommend(baseProject, professionals);
    const metrics = comp.obterMetricasCompressao();
    expect(metrics.original).toBeGreaterThan(0);
    expect(metrics.comprimido).toBeGreaterThan(0);
  });
});

describe('Decorator Pattern - Combinação', () => {
  it('Permite empilhar decoradores em qualquer ordem', () => {
    const base = new FakeStrategy();
    const withCache = new CacheDecorator(base);
    const withAudit = new AuditoriaDecorator(withCache);
    const withComp = new CompressaoDecorator(withAudit);

    withComp.recommend(baseProject, professionals);
    withComp.recommend(baseProject, professionals);

    expect(base.callCount).toBe(1);
    const logs = withAudit.obterLogs();
    expect(logs.length).toBe(2);
    const metrics = withComp.obterMetricasCompressao();
    expect(metrics.original).toBeGreaterThan(0);
  });

  it('criarPilhaDecoradores monta a pilha dinamicamente', () => {
    const base = new FakeStrategy();
    const stacked = criarPilhaDecoradores(base, {
      cache: true,
      auditoria: true,
      compressao: true,
      cacheTtlMs: 30000
    });
    const r = stacked.recommend(baseProject, professionals);
    expect(r.length).toBe(2);
    expect(base.callCount).toBe(1);
  });

  it('SistemaRecomendacao aplica decoradores sem modificar recomendador base', () => {
    const service = new RecommendationService();
    service.configurarDecoradores({ cache: true, auditoria: true, compressao: true });
    const base = new CosineSimilarityStrategy();
    const decorated = service.aplicarDecoradores(base);
    expect(decorated).not.toBe(base);
    expect(typeof decorated.recommend).toBe('function');
  });
});
