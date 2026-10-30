import { prisma } from '../database/prisma.js';
import {
  EquipeSugerida,
  Projeto,
  Recomendacao
} from '../domain/entities.js';

export class ProjectRepository {
  async findById(id: string): Promise<Projeto | undefined> {
    const project = await prisma.projeto.findUnique({
      where: { id },
      include: {
        papeis: true
      }
    });

    if (!project) {
      return undefined;
    }

    return {
      id: project.id,
      genero: project.genero,
      duracaoEstimada: project.duracaoEstimada,
      orcamentoTotal: project.orcamentoTotal,
      dataEntrega: project.dataEntrega.toISOString(),
      tipoCaptacao:
        project.tipoCaptacao as Projeto['tipoCaptacao'],
      localizacao: project.localizacao,
      papeis: project.papeis.map((papel) => ({
        papel: papel.papel,
        peso: papel.peso
      })),
      estrategia:
        project.estrategia as Projeto['estrategia']
    };
  }

  async saveRecommendationResult(
    project: Projeto,
    equipe: EquipeSugerida
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.projeto.upsert({
        where: {
          id: project.id
        },

        update: {
          genero: project.genero,
          duracaoEstimada: project.duracaoEstimada,
          orcamentoTotal: project.orcamentoTotal,
          dataEntrega: new Date(project.dataEntrega),
          tipoCaptacao: project.tipoCaptacao,
          localizacao: project.localizacao,
          estrategia: project.estrategia
        },

        create: {
          id: project.id,
          genero: project.genero,
          duracaoEstimada: project.duracaoEstimada,
          orcamentoTotal: project.orcamentoTotal,
          dataEntrega: new Date(project.dataEntrega),
          tipoCaptacao: project.tipoCaptacao,
          localizacao: project.localizacao,
          estrategia: project.estrategia
        }
      });

      await tx.papelObrigatorio.deleteMany({
        where: {
          projetoId: project.id
        }
      });

      if (project.papeis.length > 0) {
        await tx.papelObrigatorio.createMany({
          data: project.papeis.map((papel) => ({
            papel: papel.papel,
            peso: papel.peso,
            projetoId: project.id
          }))
        });
      }

      await tx.recomendacao.deleteMany({
        where: {
          projetoId: project.id
        }
      });

      if (equipe.recomendacoes.length > 0) {
        await tx.recomendacao.createMany({
          data: equipe.recomendacoes.map((recomendacao) => ({
            papel: recomendacao.papel,
            score: recomendacao.score,
            motivo: recomendacao.motivo,
            projetoId: project.id,
            profissionalId: recomendacao.profissional.id
          }))
        });
      }
    });
  }

  async saveRecommendationForRole(
    projectId: string,
    papel: string,
    recomendacao: Recomendacao
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.recomendacao.deleteMany({
        where: {
          projetoId: projectId,
          papel
        }
      });

        await tx.recomendacao.create({
        data: {
            papel: recomendacao.papel,
            score: recomendacao.score,
            motivo: recomendacao.motivo,
            projetoId: projectId,
            profissionalId: recomendacao.profissional.id
        }
        });
    });
  }
}