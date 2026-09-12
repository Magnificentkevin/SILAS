import { BadRequestException, Injectable } from '@nestjs/common';
import { OpportunityStage, Role, RunStatus, prisma } from '@repo/database';

const STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.PROSPECT,
  OpportunityStage.QUALIFIED,
  OpportunityStage.PROPOSAL,
  OpportunityStage.NEGOTIATION,
  OpportunityStage.CONTRACT_SIGNED,
];

export const HEALTH_SCORE_PENALTY = 15;

const PENALIZED_RUN_STATUSES: RunStatus[] = [RunStatus.BREACH_RECOVERY, RunStatus.CANCELLED];

@Injectable()
export class CrmPipelineService {
  async createAccount(name: string, isHealthcareSite = false) {
    return prisma.account.create({ data: { name, isHealthcareSite } });
  }

  async listAccounts() {
    return prisma.account.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * The only path by which a user gets access to an account's data — never
   * self-service at registration. Staff-only, enforced by RolesGuard at the
   * controller. Upserts so re-granting an existing membership (e.g. to
   * change role) doesn't throw a unique-constraint error.
   */
  async grantMembership(accountId: string, userId: string, role: Role) {
    return prisma.accountMembership.upsert({
      where: { userId_accountId: { userId, accountId } },
      create: { accountId, userId, role },
      update: { role },
    });
  }

  async createOpportunity(accountId: string) {
    return prisma.opportunity.create({ data: { accountId } });
  }

  async listOpportunities() {
    return prisma.opportunity.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { account: true },
    });
  }

  /** Advances an opportunity to the next stage in the pipeline. */
  async advanceOpportunity(opportunityId: string) {
    const opportunity = await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } });
    const currentIndex = STAGE_ORDER.indexOf(opportunity.stage);

    if (currentIndex === STAGE_ORDER.length - 1) {
      throw new BadRequestException(`Opportunity ${opportunityId} is already at its final stage`);
    }

    const nextStage = STAGE_ORDER[currentIndex + 1]!;
    return prisma.opportunity.update({ where: { id: opportunityId }, data: { stage: nextStage } });
  }

  /** Transitions an opportunity directly to a target stage; only forward moves are allowed. */
  async transitionOpportunity(opportunityId: string, targetStage: OpportunityStage) {
    const opportunity = await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } });
    const currentIndex = STAGE_ORDER.indexOf(opportunity.stage);
    const targetIndex = STAGE_ORDER.indexOf(targetStage);

    if (targetIndex <= currentIndex) {
      throw new BadRequestException(
        `Cannot move opportunity ${opportunityId} backward from ${opportunity.stage} to ${targetStage}`,
      );
    }

    return prisma.opportunity.update({ where: { id: opportunityId }, data: { stage: targetStage } });
  }

  /** Records a service run outcome, decrementing account health for breach/cancellation runs. */
  async recordRunOutcome(accountId: string, status: RunStatus) {
    return prisma.$transaction(async (tx) => {
      const run = await tx.run.create({ data: { accountId, status } });

      if (PENALIZED_RUN_STATUSES.includes(status)) {
        const account = await tx.account.findUniqueOrThrow({ where: { id: accountId } });
        const nextScore = Math.max(account.healthScore - HEALTH_SCORE_PENALTY, 0);
        await tx.account.update({ where: { id: accountId }, data: { healthScore: nextScore } });
      }

      return run;
    });
  }

  async getAccountHealth(accountId: string) {
    const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    return { accountId: account.id, healthScore: account.healthScore };
  }

  async listRecentRuns(limit = 20) {
    return prisma.run.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { account: true },
    });
  }
}
