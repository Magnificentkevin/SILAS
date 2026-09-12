export interface AdapterDispatchRequest {
  operation: string;
  payload: Record<string, unknown>;
}

export interface AdapterDispatchResult {
  ok: boolean;
  externalRef?: string;
  raw?: unknown;
}

/**
 * The contract every external-system adapter implements. One shape, many
 * providers — the invention's orchestration mechanism only ever depends on
 * this port, never on a specific vendor's API.
 */
export interface AdapterPort {
  readonly providerName: string;
  dispatch(request: AdapterDispatchRequest, credential: string): Promise<AdapterDispatchResult>;
  healthCheck(credential: string): Promise<boolean>;
}
