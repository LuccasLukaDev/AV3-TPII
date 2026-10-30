import { RecommendationStrategy } from '../domain/interfaces.js';
import { Projeto, Profissional, Recomendacao } from '../domain/entities.js';

export class CacheDecorator implements RecommendationStrategy {
  private cache: Map<string, { data: Recomendacao[]; timestamp: number }> = new Map();
  private ttlMs: number;
  private wrapped: RecommendationStrategy;

  constructor(wrapped: RecommendationStrategy, ttlMs: number = 60000) {
    this.wrapped = wrapped;
    this.ttlMs = ttlMs;
  }

  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[] {
    const key = this.buildKey(project, professionals);
    const cached = this.cache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.ttlMs) {
      return cached.data.map(r => ({ ...r }));
    }
    const result = this.wrapped.recommend(project, professionals);
    this.cache.set(key, { data: result, timestamp: now });
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  private buildKey(project: Projeto, professionals: Profissional[]): string {
    const profIds = professionals.map(p => p.id).sort().join(',');
    return `${project.id}|${project.estrategia ?? 'default'}|${profIds}|${project.orcamentoTotal}`;
  }
}

export class AuditoriaDecorator implements RecommendationStrategy {
  private logs: Array<{
    timestamp: string;
    projetoId: string;
    quantidadeProfissionais: number;
    quantidadeRecomendacoes: number;
    tempoMs: number;
  }> = [];
  private wrapped: RecommendationStrategy;

  constructor(wrapped: RecommendationStrategy) {
    this.wrapped = wrapped;
  }

  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[] {
    const inicio = Date.now();
    const result = this.wrapped.recommend(project, professionals);
    const tempoMs = Date.now() - inicio;
    this.logs.push({
      timestamp: new Date().toISOString(),
      projetoId: project.id,
      quantidadeProfissionais: professionals.length,
      quantidadeRecomendacoes: result.length,
      tempoMs
    });
    return result;
  }

  obterLogs(): typeof this.logs {
    return [...this.logs];
  }

  limparLogs(): void {
    this.logs = [];
  }
}

export class CompressaoDecorator implements RecommendationStrategy {
  private lastCompressedSize: number = 0;
  private lastOriginalSize: number = 0;
  private wrapped: RecommendationStrategy;

  constructor(wrapped: RecommendationStrategy) {
    this.wrapped = wrapped;
  }

  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[] {
    const result = this.wrapped.recommend(project, professionals);
    const originalJson = JSON.stringify(result);
    this.lastOriginalSize = Buffer.byteLength(originalJson, 'utf8');
    const compressed = this.compress(originalJson);
    this.lastCompressedSize = Buffer.byteLength(compressed, 'utf8');
    return result;
  }

  obterMetricasCompressao(): { original: number; comprimido: number; taxa: number } {
    const taxa = this.lastOriginalSize > 0
      ? 1 - this.lastCompressedSize / this.lastOriginalSize
      : 0;
    return {
      original: this.lastOriginalSize,
      comprimido: this.lastCompressedSize,
      taxa
    };
  }

  private compress(data: string): string {
    const seen = new Map<string, string>();
    let counter = 0;
    return data.replace(/"([^"]{8,})"/g, (match, str) => {
      if (!seen.has(str)) {
        seen.set(str, `§${counter++}`);
      }
      return `"${seen.get(str)}"`;
    });
  }
}

export function criarPilhaDecoradores(
  base: RecommendationStrategy,
  opcoes: { cache?: boolean; auditoria?: boolean; compressao?: boolean; cacheTtlMs?: number } = {}
): RecommendationStrategy {
  let strategy: RecommendationStrategy = base;
  if (opcoes.cache !== false) {
    strategy = new CacheDecorator(strategy, opcoes.cacheTtlMs ?? 60000);
  }
  if (opcoes.auditoria !== false) {
    strategy = new AuditoriaDecorator(strategy);
  }
  if (opcoes.compressao) {
    strategy = new CompressaoDecorator(strategy);
  }
  return strategy;
}
