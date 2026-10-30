import { RecommendationStrategy } from './recommendation.strategy.js';
import { Projeto, Profissional, Recomendacao } from '../domain/entities.js';

export class CollaborativeFilteringStrategy implements RecommendationStrategy {
  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[] {
    const result: Recomendacao[] = [];

    for (const papel of project.papeis) {
      const candidatos = professionals
        .filter(p => p.especialidades.some(e => e.toLowerCase().includes(papel.papel.toLowerCase())))
        .map(p => {
          const avgRating = p.avaliacoes.length
            ? p.avaliacoes.reduce((s, a) => s + a.nota, 0) / p.avaliacoes.length
            : 3;
          // Simulação simples de filtragem colaborativa (projetos similares)
          const collaborativeBoost = p.historico.length > 2 ? 0.15 : 0;
          const score = (avgRating / 5) * 0.8 + collaborativeBoost + (papel.peso * 0.05);

          return {
            papel: papel.papel,
            profissional: p,
            score,
            motivo: `Filtragem colaborativa baseada em avaliações históricas`
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      result.push(...candidatos);
    }

    return result;
  }
}