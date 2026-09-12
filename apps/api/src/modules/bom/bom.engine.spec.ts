import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirstMock = vi.fn();

vi.mock('@repo/database', () => ({
  prisma: {
    inflationIndexLog: {
      findFirst: findFirstMock,
    },
  },
}));

const { BomEngine } = await import('./bom.engine.js');

describe('BomEngine', () => {
  let engine: InstanceType<typeof BomEngine>;

  beforeEach(() => {
    findFirstMock.mockReset();
    engine = new BomEngine();
  });

  it('returns zero gallons and zero cost for zero square footage', async () => {
    findFirstMock.mockResolvedValue(null); // no PPI log -> multiplier defaults to 1

    const result = await engine.calculateLineItem({
      squareFootage: 0,
      surfaceType: 'FINISH',
      baseUnitCostCents: 500,
    });

    expect(result.gallonsRequired).toBe(0);
    expect(result.totalCostCents).toBe(0);
    expect(result.ppiMultiplier).toBe(1);
  });

  it('applies the 5% waste buffer on top of the yield matrix for FINISH', async () => {
    findFirstMock.mockResolvedValue(null);

    const result = await engine.calculateLineItem({
      squareFootage: 2000,
      surfaceType: 'FINISH',
      baseUnitCostCents: 100,
    });

    // 2000 sqft / 2000 sqft-per-gal = 1 gal base, * 1.05 waste buffer = 1.05
    expect(result.gallonsRequired).toBe(1.05);
  });

  it('applies the 5% waste buffer on top of the yield matrix for SCRUB', async () => {
    findFirstMock.mockResolvedValue(null);

    const result = await engine.calculateLineItem({
      squareFootage: 15000,
      surfaceType: 'SCRUB',
      baseUnitCostCents: 100,
    });

    // 15000 / 15000 = 1 gal base, * 1.05 = 1.05
    expect(result.gallonsRequired).toBe(1.05);
  });

  it('deterministically applies a high inflation (PPI) multiplier to unit cost and total', async () => {
    findFirstMock.mockResolvedValue({ multiplier: 3.5 });

    const result = await engine.calculateLineItem({
      squareFootage: 2000,
      surfaceType: 'FINISH',
      baseUnitCostCents: 100,
    });

    expect(result.ppiMultiplier).toBe(3.5);
    // gallonsRequired = 1.05, adjustedUnitCostCents = round(100 * 3.5) = 350
    expect(result.adjustedUnitCostCents).toBe(350);
    // totalCostCents = round(1.05 * 350) = 368 (367.5 rounds to 368)
    expect(result.totalCostCents).toBe(368);
  });

  it('is deterministic for repeated calls with identical input and PPI state', async () => {
    findFirstMock.mockResolvedValue({ multiplier: 1.25 });

    const first = await engine.calculateLineItem({
      squareFootage: 12345,
      surfaceType: 'SCRUB',
      baseUnitCostCents: 733,
    });
    const second = await engine.calculateLineItem({
      squareFootage: 12345,
      surfaceType: 'SCRUB',
      baseUnitCostCents: 733,
    });

    expect(second).toEqual(first);
  });

  it('falls back to a PPI multiplier of 1 when no inflation log exists', async () => {
    findFirstMock.mockResolvedValue(null);

    const multiplier = await engine.getLatestPpiMultiplier('SOME_SERIES_WITH_NO_DATA');

    expect(multiplier).toBe(1);
  });
});
