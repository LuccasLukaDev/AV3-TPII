import { RecommendationStrategy } from './recommendation.strategy';
import {
  Projeto,
  Profissional,
  Recomendacao
} from '../domain/entities';

function cosineSimilarity(
  a: number[],
  b: number[]
): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(normA) * Math.sqrt(normB))
  );
}

function normalizeText(
  value: string
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();
}

function specialtyScore(
  professional: Profissional,
  role: string
): number {
  const normalizedRole =
    normalizeText(role);

  const exactMatch =
    professional.especialidades.some(
      (especialidade) =>
        normalizeText(
          especialidade
        ) === normalizedRole
    );

  if (exactMatch) {
    return 1;
  }

  const partialMatch =
    professional.especialidades.some(
      (especialidade) =>
        normalizeText(
          especialidade
        ).includes(normalizedRole) ||
        normalizedRole.includes(
          normalizeText(
            especialidade
          )
        )
    );

  return partialMatch ? 0.7 : 0;
}

function ratingScore(
  professional: Profissional
): number {
  if (
    professional.avaliacoes.length === 0
  ) {
    return 0.5;
  }

  const average =
    professional.avaliacoes.reduce(
      (sum, avaliacao) =>
        sum + avaliacao.nota,
      0
    ) /
    professional.avaliacoes.length;

  return Math.max(
    0,
    Math.min(
      1,
      average / 5
    )
  );
}

function priceScore(
  professional: Profissional,
  professionals: Profissional[]
): number {
  const prices =
    professionals.map(
      (p) => p.precoMedio
    );

  const minPrice =
    Math.min(...prices);

  const maxPrice =
    Math.max(...prices);

  if (
    minPrice === maxPrice
  ) {
    return 1;
  }

  return (
    1 -
    (
      professional.precoMedio -
      minPrice
    ) /
    (
      maxPrice -
      minPrice
    )
  );
}

export class CosineSimilarityStrategy
  implements RecommendationStrategy {

  recommend(
    project: Projeto,
    professionals: Profissional[]
  ): Recomendacao[] {
    const result: Recomendacao[] = [];

    /*
     * Profissionais que já foram escolhidos
     * como melhor candidato para um papel
     * não serão priorizados novamente.
     */
    const usedProfessionals =
      new Set<string>();

    /*
     * O vetor do profissional não pode ser
     * comparado com ele mesmo multiplicado
     * pelo peso do papel, pois isso produziria
     * similaridade igual a 1.
     *
     * Como o modelo atual não possui um vetor
     * específico para cada papel, utilizamos
     * o peso do papel para construir um vetor
     * de referência distribuído nas dimensões.
     */
    for (
      const papel of project.papeis
    ) {
      const candidatos =
        professionals
          .filter(
            (professional) =>
              professional.especialidades.some(
                (especialidade) =>
                  normalizeText(
                    especialidade
                  ).includes(
                    normalizeText(
                      papel.papel
                    )
                  ) ||
                  normalizeText(
                    papel.papel
                  ).includes(
                    normalizeText(
                      especialidade
                    )
                  )
              )
          )
          .map(
            (professional) => {
              const dimensions =
                professional
                  .vetorCompetencias
                  .length;

              const targetVector =
                Array.from(
                  {
                    length:
                      dimensions
                  },
                  (_, index) =>
                    papel.peso *
                    (
                      1 +
                      index /
                      Math.max(
                        dimensions - 1,
                        1
                      )
                    )
                );

              const cosine =
                cosineSimilarity(
                  professional.vetorCompetencias,
                  targetVector
                );

              const specialty =
                specialtyScore(
                  professional,
                  papel.papel
                );

              const rating =
                ratingScore(
                  professional
                );

              const price =
                priceScore(
                  professional,
                  professionals
                );

              const alreadyUsed =
                usedProfessionals.has(
                  professional.id
                );

              /*
               * A especialidade exata é o
               * principal critério.
               *
               * O cosseno continua sendo
               * utilizado como parte importante
               * da pontuação.
               */
              let score =
                cosine * 0.45 +
                specialty * 0.30 +
                rating * 0.15 +
                price * 0.10;

              /*
               * Evita que a mesma pessoa seja
               * escolhida para vários papéis
               * quando existe outro candidato.
               */
              if (alreadyUsed) {
                score *= 0.80;
              }

              return {
                papel: papel.papel,
                profissional: professional,
                score,
                motivo:
                  'Similaridade de cosseno + especialidade + avaliação + custo'
              };
            }
          )
          .sort(
            (a, b) =>
              b.score - a.score
          )
          .slice(0, 3);

      /*
       * O primeiro candidato será o principal
       * candidato daquele papel.
       */
      if (
        candidatos.length > 0
      ) {
        usedProfessionals.add(
          candidatos[0]
            .profissional.id
        );
      }

      result.push(
        ...candidatos
      );
    }

    return result;
  }
}