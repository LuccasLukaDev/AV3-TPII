import { RecommendationStrategy } from './recommendation.strategy';
import { Projeto, Profissional, Recomendacao } from '../domain/entities';

export class LowBudgetRulesStrategy implements RecommendationStrategy {
  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[] {
    const result: Recomendacao[] = [];
    const budgetPerRole = project.orcamentoTotal / project.papeis.length;

    for (const papel of project.papeis) {
      const candidatos = professionals
        .filter(p =>
          p.especialidades.some(e => e.toLowerCase().includes(papel.papel.toLowerCase())) &&
          p.precoMedio <= budgetPerRole * 1.2
        )
        .map(p => {
          const priceScore = 1 - (p.precoMedio / (budgetPerRole * 1.5));
          const ratingScore = p.avaliacoes.length
            ? p.avaliacoes.reduce((s, a) => s + a.nota, 0) / p.avaliacoes.length / 5
            : 0.5;
          const score = priceScore * 0.6 + ratingScore * 0.4;

          return {
            papel: papel.papel,
            profissional: p,
            score,
            motivo: `Regra de negócio para orçamento reduzido (preço + qualidade)`
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      result.push(...candidatos);
    }

    return result;
  }
}