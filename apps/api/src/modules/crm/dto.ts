import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { OpportunityStage, Role, RunStatus } from '@repo/database';

const MEMBERSHIP_ROLES = [Role.VENDOR, Role.CUSTOMER, Role.HOST_CLIENT] as const;

export class CreateAccountDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isHealthcareSite?: boolean;
}

export class CreateOpportunityDto {
  @IsUUID()
  accountId!: string;
}

export class TransitionOpportunityDto {
  @IsEnum(OpportunityStage)
  stage!: OpportunityStage;
}

export class RecordRunDto {
  @IsUUID()
  accountId!: string;

  @IsEnum(RunStatus)
  status!: RunStatus;
}

export class GrantMembershipDto {
  @IsUUID()
  userId!: string;

  /** Membership roles only — ADMIN/OPERATOR/VERIFIER are global staff roles, not account-scoped. */
  @IsIn(MEMBERSHIP_ROLES)
  role!: (typeof MEMBERSHIP_ROLES)[number];
}
