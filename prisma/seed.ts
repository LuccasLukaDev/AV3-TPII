import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpa os dados antigos
  await prisma.avaliacao.deleteMany();
  await prisma.competencia.deleteMany();
  await prisma.disponibilidade.deleteMany();
  await prisma.convite.deleteMany();
  await prisma.recomendacao.deleteMany();
  await prisma.papelObrigatorio.deleteMany();
  await prisma.projeto.deleteMany();
  await prisma.profissional.deleteMany();

  const profissionais = [
    {
      id: 'p1',
      nome: 'Ana Silva',
      especialidades: ['diretor', 'roteirista'],
      precoMedio: 12000,
      localizacao: 'são paulo',
      vetorCompetencias: [9, 8, 7, 6, 9],
      historico: ['proj1', 'proj2'],
      disponibilidades: {
        create: [
          {
            inicio: new Date('2026-10-01'),
            fim: new Date('2026-12-31')
          }
        ]
      },
      competencias: {
        create: [
          {
            nome: 'direção',
            nivel: 9
          }
        ]
      },
      avaliacoes: {
        create: [
          {
            projetoId: 'proj1',
            nota: 4.8
          }
        ]
      }
    },
    {
      id: 'p2',
      nome: 'Carlos Mendes',
      especialidades: ['diretor de fotografia', 'sonoplasta'],
      precoMedio: 8000,
      localizacao: 'rio de janeiro',
      vetorCompetencias: [8, 9, 8, 7, 6],
      historico: ['proj3'],
      disponibilidades: {
        create: [
          {
            inicio: new Date('2026-09-01'),
            fim: new Date('2027-01-31')
          }
        ]
      },
      competencias: {
        create: [
          {
            nome: 'fotografia',
            nivel: 9
          }
        ]
      },
      avaliacoes: {
        create: [
          {
            projetoId: 'proj3',
            nota: 4.5
          }
        ]
      }
    },
    {
      id: 'p3',
      nome: 'Juliana Costa',
      especialidades: ['editor', 'efeitos visuais'],
      precoMedio: 6500,
      localizacao: 'são paulo',
      vetorCompetencias: [7, 6, 9, 9, 8],
      historico: ['proj1', 'proj4'],
      disponibilidades: {
        create: [
          {
            inicio: new Date('2026-10-15'),
            fim: new Date('2026-11-30')
          }
        ]
      },
      competencias: {
        create: [
          {
            nome: 'edição',
            nivel: 9
          }
        ]
      },
      avaliacoes: {
        create: [
          {
            projetoId: 'proj1',
            nota: 4.9
          },
          {
            projetoId: 'proj4',
            nota: 4.7
          }
        ]
      }
    },
    {
      id: 'p4',
      nome: 'Roberto Lima',
      especialidades: ['roteirista', 'diretor'],
      precoMedio: 5000,
      localizacao: 'belo horizonte',
      vetorCompetencias: [8, 7, 6, 8, 7],
      historico: ['proj5'],
      disponibilidades: {
        create: [
          {
            inicio: new Date('2026-09-20'),
            fim: new Date('2026-12-15')
          }
        ]
      },
      competencias: {
        create: [
          {
            nome: 'roteiro',
            nivel: 8
          }
        ]
      },
      avaliacoes: {
        create: [
          {
            projetoId: 'proj5',
            nota: 4.2
          }
        ]
      }
    },
    {
      id: 'p5',
      nome: 'Fernanda Oliveira',
      especialidades: ['sonoplasta', 'editor'],
      precoMedio: 4500,
      localizacao: 'são paulo',
      vetorCompetencias: [6, 8, 7, 9, 8],
      historico: ['proj2', 'proj3'],
      disponibilidades: {
        create: [
          {
            inicio: new Date('2026-10-01'),
            fim: new Date('2027-02-28')
          }
        ]
      },
      competencias: {
        create: [
          {
            nome: 'som',
            nivel: 9
          }
        ]
      },
      avaliacoes: {
        create: [
          {
            projetoId: 'proj2',
            nota: 4.6
          }
        ]
      }
    }
  ];

  for (const profissional of profissionais) {
    await prisma.profissional.create({
      data: profissional
    });
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });