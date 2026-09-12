export interface FiniteLease {
  id: string;
  resourceId: string;
  holder: string;
  issuedAt: Date;
  expiresAt: Date;
  signature: string;
}

export interface SagaStepDefinition<TContext> {
  name: string;
  forward: (ctx: TContext) => Promise<TContext>;
  inverse: (ctx: TContext) => Promise<TContext>;
}

export type SagaStatus = 'COMMITTED' | 'RECOVERED' | 'BREACH_RECOVERY';

export interface SagaStepResult {
  name: string;
  outcome: 'FORWARD_OK' | 'FORWARD_FAILED' | 'INVERSE_OK' | 'INVERSE_FAILED';
  at: string;
}

export interface SagaResult<TContext> {
  status: SagaStatus;
  context: TContext;
  steps: SagaStepResult[];
  failureReason?: string;
}

export interface SealedAuditEvent {
  index: number;
  type: string;
  payload: unknown;
  at: string;
  prevHash: string;
  hash: string;
}

export type SettlementStatus = 'HELD' | 'VERIFIED' | 'CAPTURED' | 'RELEASED';

export interface SettlementHold {
  id: string;
  reference: string;
  amountCents: number;
  currency: string;
  status: SettlementStatus;
  heldAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  capturedAt?: Date;
  releasedAt?: Date;
}

export interface CrdtFieldState {
  resourceId: string;
  field: string;
  value: unknown;
  timestamp: number;
  actorId: string;
}

export type SanitizationStrategy = 'TOKENIZE' | 'REDACT';

export interface SanitizationRule {
  field: string;
  strategy: SanitizationStrategy;
}

export type PreFlightSeverity = 'BLOCKING' | 'WARNING';

export interface PreFlightCheckDefinition<TContext> {
  name: string;
  severity: PreFlightSeverity;
  validate: (context: TContext) => boolean;
}

export interface PreFlightFailure {
  name: string;
  severity: PreFlightSeverity;
}

export interface PreFlightResult {
  passed: boolean;
  failures: PreFlightFailure[];
}
