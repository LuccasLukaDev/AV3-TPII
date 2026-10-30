import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { RecommendationService } from '../services/recommendation.service.js';
import { TeamService } from '../services/team.service.js';

import { ProfessionalRepository } from '../repositories/professional.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';

import { NotificationSubject } from '../observers/notification.subject.js';
import { AuditObserver } from '../observers/audit.observer.js';
import { EmailObserver } from '../observers/email.observer.js';

const projectSchema = z.object({
  id: z.string(),

  genero: z.string(),

  duracaoEstimada:
    z.number().positive(),

  orcamentoTotal:
    z.number().positive(),

  dataEntrega:
    z.string(),

  tipoCaptacao:
    z.enum([
      'documentario',
      'ficcao',
      'animacao'
    ]),

  localizacao:
    z.string(),

  papeis:
    z.array(
      z.object({
        papel: z.string(),

        peso:
          z.number()
            .min(0)
            .max(1)
      })
    )
    .min(1),

  estrategia:
    z.enum([
      'cosine',
      'collaborative',
      'low-budget'
    ])
    .optional()
});

const recommendationDecisionSchema =
  z.object({
    papel: z.string().min(1),

    profissionalId:
      z.string().min(1),

    decision:
      z.enum([
        'accept',
        'reject'
      ])
  });

const professionalResponseSchema =
  z.object({
    response:
      z.enum([
        'accept',
        'reject'
      ])
  });

const replacementSchema =
  z.object({
    papel: z.string().min(1),

    profissionalId:
      z.string().min(1).optional()
  });

interface ProjectParams {
  projectId: string;
}

interface InvitationParams {
  invitationId: string;
}

export async function recommendationRoutes(
  app: FastifyInstance
) {
  /*
   * Dependências compartilhadas.
   *
   * O mesmo Subject e o mesmo AuditObserver
   * são utilizados pelo fluxo inteiro.
   */
  const subject =
    new NotificationSubject();

  const audit =
    new AuditObserver();

  subject.attach(
    new EmailObserver()
  );

  subject.attach(audit);

  const professionalRepository =
    new ProfessionalRepository();

  const projectRepository =
    new ProjectRepository();

  const recommendationService =
    new RecommendationService(
      professionalRepository,
      projectRepository,
      subject,
      audit
    );

  const teamService =
    new TeamService(
      recommendationService
    );

  /*
   * Geração da recomendação.
   */
  app.post(
    '/recommend',
    async (request, reply) => {
      const parse =
        projectSchema.safeParse(
          request.body
        );

      if (!parse.success) {
        return reply
          .status(400)
          .send({
            error:
              parse.error.flatten()
          });
      }

      /*
       * DIAGNÓSTICO:
       *
       * Verifica exatamente quais papéis
       * chegaram no endpoint antes de qualquer
       * processamento do RecommendationService.
       */
      console.log(
        '\n========== DADOS RECEBIDOS NO /recommend =========='
      );

      console.log(
        'Projeto:',
        parse.data.id
      );

      console.log(
        'Papéis recebidos:',
        parse.data.papeis
      );

      console.log(
        'Quantidade de papéis:',
        parse.data.papeis.length
      );

      console.log(
        '===================================================\n'
      );

      try {
        const result =
          await recommendationService
            .recommend(
              parse.data
            );

        return reply.send(result);
      } catch (err: unknown) {
        console.error(
          'ERRO COMPLETO NO /recommend:',
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : 'Erro interno ao gerar recomendação.';

        return reply
          .status(400)
          .send({
            error: message
          });
      }
    }
  );

  /*
   * Produtor aceita ou rejeita
   * um profissional recomendado.
   */
  app.post(
    '/projects/:projectId/recommendations/decision',
    async (request, reply) => {
      const params =
        request.params as ProjectParams;

      const parse =
        recommendationDecisionSchema
          .safeParse(
            request.body
          );

      if (!parse.success) {
        return reply
          .status(400)
          .send({
            error:
              parse.error.flatten()
          });
      }

      try {
        const result =
          await teamService
            .decideRecommendation(
              params.projectId,
              parse.data.papel,
              parse.data.profissionalId,
              parse.data.decision
            );

        return reply.send(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao processar decisão.';

        return reply
          .status(400)
          .send({
            error: message
          });
      }
    }
  );

  /*
   * Profissional aceita ou rejeita
   * um convite.
   */
  app.patch(
    '/invites/:invitationId/response',
    async (request, reply) => {
      const params =
        request.params as InvitationParams;

      const parse =
        professionalResponseSchema
          .safeParse(
            request.body
          );

      if (!parse.success) {
        return reply
          .status(400)
          .send({
            error:
              parse.error.flatten()
          });
      }

      try {
        const result =
          await teamService
            .respondToInvitation(
              params.invitationId,
              parse.data.response
            );

        return reply.send(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao responder convite.';

        return reply
          .status(400)
          .send({
            error: message
          });
      }
    }
  );

  /*
   * Substituição manual de profissional.
   *
   * Somente o papel informado é
   * recalculado.
   */
  app.post(
    '/projects/:projectId/replace',
    async (request, reply) => {
      const params =
        request.params as ProjectParams;

      const parse =
        replacementSchema.safeParse(
          request.body
        );

      if (!parse.success) {
        return reply
          .status(400)
          .send({
            error:
              parse.error.flatten()
          });
      }

      try {
        const recommendation =
          await teamService.replace(
            params.projectId,
            parse.data.papel,
            parse.data.profissionalId
          );

        return reply.send({
          projetoId:
            params.projectId,
          novaRecomendacao:
            recommendation
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao substituir profissional.';

        return reply
          .status(400)
          .send({
            error: message
          });
      }
    }
  );

  /*
   * Lista os convites do projeto.
   */
  app.get(
    '/projects/:projectId/invites',
    async (request, reply) => {
      const params =
        request.params as ProjectParams;

      try {
        const result =
          await teamService
            .getProjectInvitations(
              params.projectId
            );

        return reply.send(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao buscar convites.';

        return reply
          .status(400)
          .send({
            error: message
          });
      }
    }
  );

  /*
   * Retorna a composição final,
   * formada pelos convites aceitos.
   */
  app.get(
    '/projects/:projectId/team',
    async (request, reply) => {
      const params =
        request.params as ProjectParams;

      try {
        const result =
          await teamService.getFinalTeam(
            params.projectId
          );

        return reply.send({
          projetoId:
            params.projectId,
          equipeFinal:
            result
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao buscar equipe final.';

        return reply
          .status(400)
          .send({
            error: message
          });
      }
    }
  );

  /*
   * Auditoria.
   */
  app.get(
    '/audit',
    async () => {
      return audit.getLogs();
    }
  );
}