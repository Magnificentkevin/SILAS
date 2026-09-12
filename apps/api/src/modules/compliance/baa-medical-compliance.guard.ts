import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/database';
import { BaaComplianceService } from './baa-compliance.service.js';

/**
 * Blocks any request carrying an `accountId` for a healthcare site
 * (`Account.isHealthcareSite === true`) unless a current BAA acceptance is on file.
 */
@Injectable()
export class BaaMedicalComplianceGuard implements CanActivate {
  constructor(private readonly complianceService: BaaComplianceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accountId: string | undefined = request.body?.accountId;

    if (!accountId) {
      throw new ForbiddenException('accountId is required to evaluate BAA compliance');
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    if (!account.isHealthcareSite) {
      return true;
    }

    const hasAcceptance = await this.complianceService.hasCurrentAcceptance(accountId);
    if (!hasAcceptance) {
      throw new ForbiddenException(
        'Bids on healthcare sites require a current BAA acceptance before they can proceed',
      );
    }

    return true;
  }
}
