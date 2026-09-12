import { describe, expect, it } from 'vitest';
import { MetadataSyncService } from './metadata-sync-service.js';
import type { CrdtFieldState } from '../runtime/types.js';

describe('MetadataSyncService', () => {
  it('records a local write and reads it back', () => {
    const service = new MetadataSyncService();
    service.applyLocal('robot-7', 'notes', 'needs inspection', 'device-a', 100);

    expect(service.get('robot-7', 'notes')).toEqual({
      resourceId: 'robot-7',
      field: 'notes',
      value: 'needs inspection',
      timestamp: 100,
      actorId: 'device-a',
    });
  });

  it('returns undefined for a field that has never been written', () => {
    const service = new MetadataSyncService();
    expect(service.get('robot-7', 'notes')).toBeUndefined();
  });

  it('snapshots every field written for a resource, and no other resource', () => {
    const service = new MetadataSyncService();
    service.applyLocal('robot-7', 'notes', 'a', 'device-a', 100);
    service.applyLocal('robot-7', 'status', 'idle', 'device-a', 101);
    service.applyLocal('robot-8', 'notes', 'unrelated', 'device-a', 100);

    const snapshot = service.getSnapshot('robot-7');
    expect(snapshot).toHaveLength(2);
    expect(snapshot.map((f) => f.field).sort()).toEqual(['notes', 'status']);
  });

  describe('merge', () => {
    it('stores the remote value when there is no existing local state', () => {
      const service = new MetadataSyncService();
      const remote: CrdtFieldState = { resourceId: 'robot-7', field: 'notes', value: 'from-remote', timestamp: 100, actorId: 'device-b' };

      const result = service.merge(remote);
      expect(result.value).toBe('from-remote');
      expect(service.get('robot-7', 'notes')?.value).toBe('from-remote');
    });

    it('a later remote update overwrites earlier local state', () => {
      const service = new MetadataSyncService();
      service.applyLocal('robot-7', 'notes', 'local-old', 'device-a', 100);

      const result = service.merge({ resourceId: 'robot-7', field: 'notes', value: 'remote-new', timestamp: 200, actorId: 'device-b' });
      expect(result.value).toBe('remote-new');
    });

    it('an earlier remote update leaves newer local state unchanged', () => {
      const service = new MetadataSyncService();
      service.applyLocal('robot-7', 'notes', 'local-new', 'device-a', 200);

      const result = service.merge({ resourceId: 'robot-7', field: 'notes', value: 'remote-old', timestamp: 100, actorId: 'device-b' });
      expect(result.value).toBe('local-new');
    });

    it('is idempotent: merging the same remote update twice does not change the result', () => {
      const service = new MetadataSyncService();
      const remote: CrdtFieldState = { resourceId: 'robot-7', field: 'notes', value: 'from-remote', timestamp: 100, actorId: 'device-b' };

      service.merge(remote);
      const second = service.merge(remote);
      expect(second).toEqual(service.get('robot-7', 'notes'));
    });

    it('converges to the same state regardless of merge order when two updates tie on timestamp', () => {
      const fromDeviceX: CrdtFieldState = { resourceId: 'robot-7', field: 'status', value: 'x-wins', timestamp: 100, actorId: 'device-x' };
      const fromDeviceY: CrdtFieldState = { resourceId: 'robot-7', field: 'status', value: 'y-wins', timestamp: 100, actorId: 'device-y' };

      const orderXThenY = new MetadataSyncService();
      orderXThenY.merge(fromDeviceX);
      orderXThenY.merge(fromDeviceY);

      const orderYThenX = new MetadataSyncService();
      orderYThenX.merge(fromDeviceY);
      orderYThenX.merge(fromDeviceX);

      expect(orderXThenY.get('robot-7', 'status')).toEqual(orderYThenX.get('robot-7', 'status'));
    });
  });
});
