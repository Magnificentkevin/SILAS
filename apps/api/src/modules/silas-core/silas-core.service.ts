import { Injectable } from '@nestjs/common';
import { AuditVault, LeaseService, MetadataSyncService, PreFlightEngine, SagaEngine, SanitizationEngine, SettlementService } from '@repo/silas-core';
import type { CrdtFieldState, FiniteLease, PreFlightCheckDefinition, SagaStepDefinition, SettlementHold } from '@repo/silas-core';

const DEMO_SETTLEMENT_AMOUNT_CENTS = 5_000;
const DEMO_SETTLEMENT_CURRENCY = 'USD';
const DEMO_VERIFIER_ID = 'silas-core-demo-verifier';
const DEMO_REMOTE_ACTOR_ID = 'field-tablet-demo';
const DEMO_CUSTOMER_EMAIL = 'jane@example.com';
const DEMO_PAYMENT_CARD = '4242424242424242';

interface SanitizedDemoPayload {
  [key: string]: unknown;
  resourceId: string;
  customerEmail: string;
  paymentCard: string;
}

export interface DemoContext {
  resourceId: string;
  sanitizedPayload?: SanitizedDemoPayload;
  lease?: FiniteLease;
  dispatchedSystems: string[];
  settlementHold?: SettlementHold;
  metadataStatus?: CrdtFieldState;
}

/**
 * Wires the invention-spine primitives (sanitization + lease arbitration +
 * CRDT metadata sync + Saga inverse recovery + controlled settlement + the
 * cryptographic audit chain) into the two demo scripts from the MVP
 * Technical Specification: golden path and failure path.
 */
@Injectable()
export class SilasCoreService {
  private readonly leaseService = new LeaseService();
  private readonly auditVault = new AuditVault();
  private readonly settlementService = new SettlementService();
  private readonly metadataSyncService = new MetadataSyncService();
  private readonly sanitizationEngine = new SanitizationEngine();
  private readonly preFlightEngine = new PreFlightEngine<DemoContext>();

  async runGoldenPath(resourceId: string) {
    const engine = new SagaEngine<DemoContext>(this.buildSteps(false));
    const result = await engine.run({ resourceId, dispatchedSystems: [] });
    this.auditVault.append('demo.golden_path', { resourceId, status: result.status });
    return result;
  }

  async runFailurePath(resourceId: string) {
    const engine = new SagaEngine<DemoContext>(this.buildSteps(true));
    const result = await engine.run({ resourceId, dispatchedSystems: [] });
    this.auditVault.append('demo.failure_path', { resourceId, status: result.status });
    return result;
  }

  getAuditChain() {
    return this.auditVault.getChain();
  }

  verifyAuditChain() {
    return this.auditVault.verify();
  }

  private buildSteps(injectFailure: boolean): SagaStepDefinition<DemoContext>[] {
    return [
      {
        name: 'sanitize-request-payload',
        forward: async (ctx) => {
          const sanitized = this.sanitizationEngine.sanitize<SanitizedDemoPayload>(
            { resourceId: ctx.resourceId, customerEmail: DEMO_CUSTOMER_EMAIL, paymentCard: DEMO_PAYMENT_CARD },
            [
              { field: 'customerEmail', strategy: 'TOKENIZE' },
              { field: 'paymentCard', strategy: 'REDACT' },
            ],
          );
          this.auditVault.append('payload.sanitized', {
            resourceId: ctx.resourceId,
            customerEmailToken: sanitized.customerEmail,
            paymentCardMasked: sanitized.paymentCard,
          });
          return { ...ctx, sanitizedPayload: sanitized };
        },
        // Sanitization is a pure, stateless transform with no side effects
        // to undo — there is nothing for recovery to compensate here.
        inverse: async (ctx) => ctx,
      },
      {
        name: 'pre-flight-validation',
        forward: async (ctx) => {
          const checks: PreFlightCheckDefinition<DemoContext>[] = [
            { name: 'resource-id-present', severity: 'BLOCKING', validate: (c) => Boolean(c.resourceId) },
            { name: 'sanitized-payload-present', severity: 'BLOCKING', validate: (c) => Boolean(c.sanitizedPayload) },
          ];
          const result = this.preFlightEngine.run(checks, ctx);
          this.auditVault.append('preflight.checked', {
            resourceId: ctx.resourceId,
            passed: result.passed,
            failures: result.failures,
          });
          if (!result.passed) {
            throw new Error(`pre-flight validation failed: ${JSON.stringify(result.failures)}`);
          }
          return ctx;
        },
        // A pure read-only validation gate — nothing to compensate if a
        // later step fails.
        inverse: async (ctx) => ctx,
      },
      {
        name: 'acquire-finite-lease',
        forward: async (ctx) => {
          const lease = this.leaseService.acquire(ctx.resourceId, 'silas-core-demo', 60_000);
          this.auditVault.append('lease.acquired', { resourceId: ctx.resourceId, leaseId: lease.id });
          return { ...ctx, lease };
        },
        inverse: async (ctx) => {
          if (ctx.lease) {
            this.leaseService.release(ctx.lease);
            this.auditVault.append('lease.released', { resourceId: ctx.resourceId, leaseId: ctx.lease.id });
          }
          return { ...ctx, lease: undefined };
        },
      },
      {
        name: 'sync-resource-metadata',
        forward: async (ctx) => {
          const local = this.metadataSyncService.applyLocal(
            ctx.resourceId,
            'status',
            'dispatch-in-progress',
            'silas-core-demo',
          );
          this.auditVault.append('metadata.applied_local', {
            resourceId: ctx.resourceId,
            field: local.field,
            value: local.value,
          });

          // Simulates a concurrent update from a second, offline device
          // arriving and being reconciled — the actual offline-sync scenario
          // this mechanism exists for.
          const merged = this.metadataSyncService.merge({
            resourceId: ctx.resourceId,
            field: 'status',
            value: 'dispatch-in-progress-ack',
            timestamp: local.timestamp + 1,
            actorId: DEMO_REMOTE_ACTOR_ID,
          });
          this.auditVault.append('metadata.merged', {
            resourceId: ctx.resourceId,
            field: merged.field,
            value: merged.value,
            actorId: merged.actorId,
          });

          return { ...ctx, metadataStatus: merged };
        },
        // CRDT state is monotonic and convergent, not reversible — there is
        // no meaningful "undo" for a merged field the way there is for a
        // lease or a settlement hold, so recovery leaves it as-is.
        inverse: async (ctx) => ctx,
      },
      {
        name: 'dispatch-external-adapters',
        forward: async (ctx) => {
          if (injectFailure) {
            throw new Error('adapter for system B rejected the operation');
          }
          this.auditVault.append('adapters.dispatched', { resourceId: ctx.resourceId, systems: ['A', 'B'] });
          return { ...ctx, dispatchedSystems: ['A', 'B'] };
        },
        inverse: async (ctx) => {
          this.auditVault.append('adapters.compensated', {
            resourceId: ctx.resourceId,
            systems: ctx.dispatchedSystems,
          });
          return { ...ctx, dispatchedSystems: [] };
        },
      },
      {
        name: 'authorize-and-stage-settlement',
        forward: async (ctx) => {
          const held = this.settlementService.hold(
            ctx.resourceId,
            DEMO_SETTLEMENT_AMOUNT_CENTS,
            DEMO_SETTLEMENT_CURRENCY,
          );
          this.auditVault.append('settlement.held', { resourceId: ctx.resourceId, holdId: held.id });

          const verified = this.settlementService.verify(held.id, DEMO_VERIFIER_ID);
          this.auditVault.append('settlement.verified', {
            resourceId: ctx.resourceId,
            holdId: verified.id,
            verifiedBy: verified.verifiedBy,
          });

          return { ...ctx, settlementHold: verified };
        },
        inverse: async (ctx) => {
          if (ctx.settlementHold) {
            const released = this.settlementService.release(ctx.settlementHold.id);
            this.auditVault.append('settlement.released', { resourceId: ctx.resourceId, holdId: released.id });
            return { ...ctx, settlementHold: released };
          }
          return ctx;
        },
      },
      {
        name: 'commit',
        forward: async (ctx) => {
          if (ctx.settlementHold) {
            const captured = this.settlementService.capture(ctx.settlementHold.id);
            this.auditVault.append('settlement.captured', { resourceId: ctx.resourceId, holdId: captured.id });
            ctx = { ...ctx, settlementHold: captured };
          }
          this.auditVault.append('commit', { resourceId: ctx.resourceId });
          return ctx;
        },
        inverse: async (ctx) => ctx,
      },
    ];
  }
}
