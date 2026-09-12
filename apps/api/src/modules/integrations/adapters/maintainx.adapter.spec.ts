import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintainXAdapter } from './maintainx.adapter.js';

describe('MaintainXAdapter', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dispatches to the workorders endpoint with a bearer token and the caller payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'wo_123' }),
    });

    const adapter = new MaintainXAdapter();
    const result = await adapter.dispatch(
      { operation: 'create-work-order', payload: { title: 'Deep clean lobby', facilityId: 'robot-7' } },
      'test-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.getmaintainx.com/v1/workorders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        body: JSON.stringify({ title: 'Deep clean lobby', facilityId: 'robot-7' }),
      }),
    );
    expect(result).toEqual({ ok: true, raw: { id: 'wo_123' }, externalRef: 'wo_123' });
  });

  it('reports ok:false without throwing when the API rejects the request', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'unauthorized' }) });

    const adapter = new MaintainXAdapter();
    const result = await adapter.dispatch({ operation: 'create-work-order', payload: {} }, 'bad-token');

    expect(result.ok).toBe(false);
    expect(result.externalRef).toBeUndefined();
  });

  it('checks health against the list endpoint with a bearer token', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const adapter = new MaintainXAdapter();
    const healthy = await adapter.healthCheck('test-token');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.getmaintainx.com/v1/workorders?limit=1',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
    expect(healthy).toBe(true);
  });
});
