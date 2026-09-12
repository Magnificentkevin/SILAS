import { beforeEach, describe, expect, it, vi } from 'vitest';

const runFindUniqueMock = vi.fn();
const telemetryCountMock = vi.fn();
const inflationFindFirstMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    run: { findUnique: runFindUniqueMock },
    telemetryPing: { count: telemetryCountMock },
    inflationIndexLog: { findFirst: inflationFindFirstMock },
  },
}));

const { BomEngine } = await import('../bom/bom.engine.js');
const { FourWayMatchService, MIN_TELEMETRY_PINGS_IN_GEOFENCE } = await import('./four-way-match.service.js');

const BASE_INPUT = {
  facilityId: 'facility-1',
  runId: 'run-today',
  closetSupplyScanned: true,
  coverageHeatmapComplete: true,
  invoicedAmountCents: 100,
  squareFootage: 2000,
  surfaceType: 'FINISH' as const,
  baseUnitCostCents: 100,
};

describe('FourWayMatchService.evaluateMatch', () => {
  let service: InstanceType<typeof FourWayMatchService>;

  beforeEach(() => {
    runFindUniqueMock.mockReset();
    telemetryCountMock.mockReset();
    inflationFindFirstMock.mockReset();
    inflationFindFirstMock.mockResolvedValue(null); // PPI multiplier defaults to 1
    service = new FourWayMatchService(new BomEngine());
  });

  it('rejects a settlement request for an unknown run', async () => {
    runFindUniqueMock.mockResolvedValue(null);

    await expect(service.evaluateMatch(BASE_INPUT)).rejects.toThrow('Unknown run');
    expect(telemetryCountMock).not.toHaveBeenCalled();
  });

  it("rejects when the run doesn't belong to the given facility", async () => {
    runFindUniqueMock.mockResolvedValue({ id: 'run-today', accountId: 'some-other-facility' });

    await expect(service.evaluateMatch(BASE_INPUT)).rejects.toThrow('does not belong to facility');
    expect(telemetryCountMock).not.toHaveBeenCalled();
  });

  it("does not let a prior run's telemetry validate today's run (the R04 finding)", async () => {
    runFindUniqueMock.mockResolvedValue({ id: 'run-today', accountId: 'facility-1' });
    // Only yesterday's run has pings recorded; today's run (being settled) has none.
    // The count query is scoped to runId, so it must return 0 here, not the
    // facility's historical total.
    telemetryCountMock.mockImplementation(({ where }: { where: { runId: string } }) =>
      Promise.resolve(where.runId === 'run-yesterday' ? MIN_TELEMETRY_PINGS_IN_GEOFENCE : 0),
    );

    const result = await service.evaluateMatch(BASE_INPUT);

    expect(telemetryCountMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { runId: 'run-today', isInsideGeofence: true } }),
    );
    expect(result.checks.telemetryOk).toBe(false);
    expect(result.matched).toBe(false);
  });

  it("matches when today's own run has sufficient in-geofence telemetry", async () => {
    runFindUniqueMock.mockResolvedValue({ id: 'run-today', accountId: 'facility-1' });
    telemetryCountMock.mockResolvedValue(MIN_TELEMETRY_PINGS_IN_GEOFENCE);

    const result = await service.evaluateMatch(BASE_INPUT);

    expect(result.checks.telemetryOk).toBe(true);
  });
});
