import { Profissional as PrismaProfissional } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { Profissional } from '../domain/entities.js';

type PrismaProfissionalCompleto =
  PrismaProfissional & {
    disponibilidades: {
      inicio: Date;
      fim: Date;
    }[];

    competencias: {
      nome: string;
      nivel: number;
    }[];

    avaliacoes: {
      projetoId: string;
      nota: number;
      comentario: string | null;
    }[];
  };

export class ProfessionalRepository {
  async findAll(): Promise<Profissional[]> {
    const profissionais =
      await prisma.profissional.findMany({
        include: {
          disponibilidades: true,
          competencias: true,
          avaliacoes: true
        }
      });

    return profissionais.map(
      (profissional) =>
        this.mapToDomain(profissional)
    );
  }

  async findById(
    id: string
  ): Promise<Profissional | undefined> {
    const profissional =
      await prisma.profissional.findUnique({
        where: { id },

        include: {
          disponibilidades: true,
          competencias: true,
          avaliacoes: true
        }
      });

    return profissional
      ? this.mapToDomain(profissional)
      : undefined;
  }

  private mapToDomain(
    p: PrismaProfissionalCompleto
  ): Profissional {
    return {
      id: p.id,

      nome: p.nome,

      especialidades:
        p.especialidades,

      precoMedio:
        p.precoMedio,

      disponibilidade:
        p.disponibilidades.map(
          (
            d: PrismaProfissionalCompleto['disponibilidades'][number]
          ) => ({
            inicio:
              d.inicio
                .toISOString()
                .split('T')[0],

            fim:
              d.fim
                .toISOString()
                .split('T')[0]
          })
        ),

      localizacao:
        p.localizacao,

      vetorCompetencias:
        p.vetorCompetencias,

      competencias:
        p.competencias.map(
          (
            c: PrismaProfissionalCompleto['competencias'][number]
          ) => ({
            nome: c.nome,
            nivel: c.nivel
          })
        ),

      historico:
        p.historico,

      avaliacoes:
        p.avaliacoes.map(
          (
            a: PrismaProfissionalCompleto['avaliacoes'][number]
          ) => ({
            projetoId: a.projetoId,
            nota: a.nota,
            comentario:
              a.comentario ??
              undefined
          })
        )
    };
  }
}