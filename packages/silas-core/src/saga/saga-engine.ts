import type { SagaResult, SagaStepDefinition, SagaStepResult } from '../runtime/types.js';

/**
 * Deterministic orchestration across heterogeneous steps, with explicit inverse
 * mutations for failure recovery. Mechanism family D from the Patent Core Audit.
 */
export class SagaEngine<TContext> {
  constructor(private readonly steps: SagaStepDefinition<TContext>[]) {}

  async run(initialContext: TContext): Promise<SagaResult<TContext>> {
    const completed: SagaStepDefinition<TContext>[] = [];
    const history: SagaStepResult[] = [];
    let context = initialContext;

    for (const step of this.steps) {
      try {
        context = await step.forward(context);
        completed.push(step);
        history.push({ name: step.name, outcome: 'FORWARD_OK', at: new Date().toISOString() });
      } catch (err) {
        history.push({ name: step.name, outcome: 'FORWARD_FAILED', at: new Date().toISOString() });
        return this.recover(context, completed, history, err instanceof Error ? err.message : String(err));
      }
    }

    return { status: 'COMMITTED', context, steps: history };
  }

  private async recover(
    context: TContext,
    completed: SagaStepDefinition<TContext>[],
    history: SagaStepResult[],
    failureReason: string,
  ): Promise<SagaResult<TContext>> {
    let recoveredContext = context;

    for (const step of [...completed].reverse()) {
      try {
        recoveredContext = await step.inverse(recoveredContext);
        history.push({ name: step.name, outcome: 'INVERSE_OK', at: new Date().toISOString() });
      } catch {
        history.push({ name: step.name, outcome: 'INVERSE_FAILED', at: new Date().toISOString() });
        return { status: 'BREACH_RECOVERY', context: recoveredContext, steps: history, failureReason };
      }
    }

    return { status: 'RECOVERED', context: recoveredContext, steps: history, failureReason };
  }
}
