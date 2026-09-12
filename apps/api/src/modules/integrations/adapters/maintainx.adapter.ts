import type { AdapterDispatchRequest, AdapterDispatchResult, AdapterPort } from '@repo/silas-core';

const BASE_URL = 'https://api.getmaintainx.com/v1';

/**
 * Reference adapter for MaintainX (Facility Management).
 *
 * The route itself was verified live against the real API (not guessed from
 * docs): `POST/GET https://api.getmaintainx.com/v1/workorders` returns
 * `{"error":"Invalid token"}` for a bad bearer token — proof the route
 * exists and auth ran — whereas the hyphenated `/work-orders` 404s as an
 * unmatched route. The exact field shape for creating a work order sits
 * behind a Swagger UI this environment can't render, so `dispatch` forwards
 * the caller's payload as-is rather than guessing field names — fill that
 * shape in once a real API key is available to test against.
 */
export class MaintainXAdapter implements AdapterPort {
  readonly providerName = 'MaintainX';

  async dispatch(request: AdapterDispatchRequest, credential: string): Promise<AdapterDispatchResult> {
    const response = await fetch(`${BASE_URL}/workorders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.payload),
    });

    const raw = await response.json().catch(() => undefined);
    const externalRef = typeof (raw as { id?: unknown })?.id === 'string' ? (raw as { id: string }).id : undefined;

    return { ok: response.ok, raw, externalRef };
  }

  async healthCheck(credential: string): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/workorders?limit=1`, {
      headers: { Authorization: `Bearer ${credential}` },
    });
    return response.ok;
  }
}
