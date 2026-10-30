import { Projeto } from '../domain/entities.js';

import { InvitationRepository } from '../repositories/invitation.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { ProfessionalRepository } from '../repositories/professional.repository.js';

import { RecommendationService } from './recommendation.service.js';

import { NotificationSubject } from '../observers/notification.subject.js';

type RecommendationDecision =
  | 'accept'
  | 'reject';

type ProfessionalResponse =
  | 'accept'
  | 'reject';

export class TeamService {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly invitationRepository:
      InvitationRepository =
      new InvitationRepository(),
    private readonly projectRepository:
      ProjectRepository =
      new ProjectRepository(),
    private readonly professionalRepository:
      ProfessionalRepository =
      new ProfessionalRepository(),
    private readonly subject:
      NotificationSubject =
      recommendationService.getNotificationSubject()
  ) {}

  async decideRecommendation(
    projectId: string,
    papel: string,
    profissionalId: string,
    decision: RecommendationDecision
  ) {
    const project =
      await this.projectRepository.findById(
        projectId
      );

    if (!project) {
      throw new Error(
        'Projeto não encontrado.'
      );
    }

    const normalizedRole =
      this.normalizeText(papel);

    const exists =
      await this.invitationRepository
        .recommendationExists(
          projectId,
          normalizedRole,
          profissionalId
        );

    if (!exists) {
      throw new Error(
        'O profissional informado não possui uma recomendação para esse papel.'
      );
    }

    if (decision === 'accept') {
      const invitation =
        await this.invitationRepository.create(
          projectId,
          normalizedRole,
          profissionalId
        );

      this.subject.notify(
        'professional_invited',
        {
          projetoId: projectId,
          papel: normalizedRole,
          profissionalId,
          conviteId: invitation.id
        }
      );

      return {
        action: 'invited',
        convite: invitation
      };
    }

    const replacement =
      await this.replaceProfessional(
        project,
        normalizedRole,
        profissionalId
      );

    this.subject.notify(
      'recommendation_rejected',
      {
        projetoId: projectId,
        papel: normalizedRole,
        profissionalId,
        novaRecomendacao:
          replacement.recomendacao
      }
    );

    return {
      action: 'replaced',
      novaRecomendacao:
        replacement.recomendacao,
      convite:
        replacement.convite
    };
  }

  async respondToInvitation(
    invitationId: string,
    response: ProfessionalResponse
  ) {
    const invitation =
      await this.invitationRepository
        .findById(invitationId);

    if (!invitation) {
      throw new Error(
        'Convite não encontrado.'
      );
    }

    if (
      invitation.status !==
      'produtor_aceitou'
    ) {
      throw new Error(
        'Este convite ainda não está aguardando resposta do profissional.'
      );
    }

    if (response === 'reject') {
      const updated =
        await this.invitationRepository
          .updateStatus(
            invitationId,
            'rejeitado_profissional'
          );

      this.subject.notify(
        'professional_rejected_invitation',
        {
          conviteId: invitationId,
          projetoId:
            invitation.projetoId,
          profissionalId:
            invitation.profissionalId,
          papel: invitation.papel
        }
      );

      const project =
        await this.projectRepository.findById(
          invitation.projetoId
        );

      if (!project) {
        throw new Error(
          'Projeto relacionado ao convite não encontrado.'
        );
      }

      const replacement =
        await this.replaceProfessional(
          project,
          invitation.papel,
          invitation.profissionalId
        );

      return {
        convite: updated,
        novaRecomendacao:
          replacement.recomendacao,
        novoConvite:
          replacement.convite
      };
    }

    const updated =
      await this.invitationRepository
        .updateStatus(
          invitationId,
          'aceito'
        );

    this.subject.notify(
      'professional_accepted_invitation',
      {
        conviteId: invitationId,
        projetoId:
          invitation.projetoId,
        profissionalId:
          invitation.profissionalId,
        papel: invitation.papel
      }
    );

    const finalized =
      await this.isTeamFinalized(
        invitation.projetoId
      );

    if (finalized) {
      const finalTeam =
        await this.getFinalTeam(
          invitation.projetoId
        );

      this.subject.notify(
        'team_finalized',
        {
          projetoId:
            invitation.projetoId,
          equipeFinal: finalTeam
        }
      );

      return {
        convite: updated,
        equipeFinal: finalTeam,
        finalized: true
      };
    }

    return {
      convite: updated,
      finalized: false
    };
  }

  async replace(
    projectId: string,
    papel: string,
    profissionalId?: string
  ) {
    const project =
      await this.projectRepository.findById(
        projectId
      );

    if (!project) {
      throw new Error(
        'Projeto não encontrado.'
      );
    }

    const replacement =
      await this.replaceProfessional(
        project,
        papel,
        profissionalId
      );

    return {
      novaRecomendacao:
        replacement.recomendacao,
      convite:
        replacement.convite
    };
  }

  async getFinalTeam(
    projectId: string
  ) {
    return this.invitationRepository
      .findAcceptedByProject(
        projectId
      );
  }

  async getProjectInvitations(
    projectId: string
  ) {
    return this.invitationRepository
      .findByProject(projectId);
  }

  private async replaceProfessional(
    project: Projeto,
    papel: string,
    profissionalId?: string
  ) {
    const normalizedRole =
      this.normalizeText(papel);

    const activeInvitations =
      await this.invitationRepository
        .findActiveByProjectAndRole(
          project.id,
          normalizedRole
        );

    const excludedIds =
      new Set<string>();

    for (
      const invitation
      of activeInvitations
    ) {
      excludedIds.add(
        invitation.profissionalId
      );
    }

    if (profissionalId) {
      excludedIds.add(
        profissionalId
      );
    }

    for (
      const invitation
      of activeInvitations
    ) {
      if (
        profissionalId === undefined ||
        invitation.profissionalId ===
          profissionalId
      ) {
        await this.invitationRepository
          .updateStatus(
            invitation.id,
            'substituido'
          );
      }
    }

    const recomendacao =
      await this.recommendationService
        .recommendForRole(
          project,
          normalizedRole,
          Array.from(excludedIds)
        );

    const convite =
      await this.invitationRepository.create(
        project.id,
        normalizedRole,
        recomendacao.profissional.id
      );

    this.subject.notify(
      'professional_invited',
      {
        projetoId: project.id,
        papel: normalizedRole,
        profissionalId:
          recomendacao.profissional.id,
        conviteId: convite.id
      }
    );

    return {
      recomendacao,
      convite
    };
  }

  private async isTeamFinalized(
    projectId: string
  ): Promise<boolean> {
    const project =
      await this.projectRepository.findById(
        projectId
      );

    if (!project) {
      return false;
    }

    const accepted =
      await this.invitationRepository
        .findAcceptedByProject(
          projectId
        );

    const requiredRoles =
      project.papeis.map((papel) =>
        this.normalizeText(
          papel.papel
        )
      );

    const acceptedRoles =
      accepted.map((invitation) =>
        this.normalizeText(
          invitation.papel
        )
      );

    console.log(
      '\n========== FINALIZAÇÃO DA EQUIPE =========='
    );

    console.log(
      'Papéis obrigatórios:',
      requiredRoles
    );

    console.log(
      'Papéis aceitos:',
      acceptedRoles
    );

    console.log(
      'Convites aceitos:',
      accepted.map((invitation) => ({
        id: invitation.id,
        papel: invitation.papel,
        profissionalId:
          invitation.profissionalId,
        status: invitation.status
      }))
    );

    const missingRoles =
      requiredRoles.filter(
        (requiredRole) =>
          !acceptedRoles.includes(
            requiredRole
          )
      );

    console.log(
      'Papéis faltando:',
      missingRoles
    );

    const finalized =
      requiredRoles.length > 0 &&
      missingRoles.length === 0;

    console.log(
      'EQUIPE FINALIZADA:',
      finalized
    );

    console.log(
      '===========================================\n'
    );

    return finalized;
  }

  private normalizeText(
    value: string
  ): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}