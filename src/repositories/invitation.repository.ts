import { prisma } from '../database/prisma.js';

export class InvitationRepository {
  async create(
    projectId: string,
    papel: string,
    profissionalId: string
  ) {
    return prisma.convite.create({
      data: {
        projetoId: projectId,
        papel,
        profissionalId,
        status: 'produtor_aceitou'
      },
      include: {
        profissional: true,
        projeto: true
      }
    });
  }

  async findById(id: string) {
    return prisma.convite.findUnique({
      where: { id },
      include: {
        profissional: true,
        projeto: true
      }
    });
  }

  async findByProject(projectId: string) {
    return prisma.convite.findMany({
      where: {
        projetoId: projectId
      },
      include: {
        profissional: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async findByProjectAndRole(
    projectId: string,
    papel: string
  ) {
    return prisma.convite.findMany({
      where: {
        projetoId: projectId,
        papel
      },
      include: {
        profissional: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findActiveByProjectAndRole(
    projectId: string,
    papel: string
  ) {
    return prisma.convite.findMany({
      where: {
        projetoId: projectId,
        papel,
        status: {
          in: [
            'produtor_aceitou',
            'aceito'
          ]
        }
      },
      include: {
        profissional: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findAcceptedByProject(projectId: string) {
    return prisma.convite.findMany({
      where: {
        projetoId: projectId,
        status: 'aceito'
      },
      include: {
        profissional: true
      },
      orderBy: {
        papel: 'asc'
      }
    });
  }

  async updateStatus(
    id: string,
    status: string
  ) {
    return prisma.convite.update({
      where: { id },
      data: { status },
      include: {
        profissional: true,
        projeto: true
      }
    });
  }

  async recommendationExists(
    projectId: string,
    papel: string,
    profissionalId: string
  ): Promise<boolean> {
    const recommendation =
      await prisma.recomendacao.findFirst({
        where: {
          projetoId: projectId,
          papel,
          profissionalId
        }
      });

    return recommendation !== null;
  }
}