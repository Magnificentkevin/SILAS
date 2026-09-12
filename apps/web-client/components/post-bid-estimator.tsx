"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type SurfaceType = "FINISH" | "SCRUB";

interface BomResult {
  surfaceType: SurfaceType;
  squareFootage: number;
  yieldSqftPerGallon: number;
  gallonsRequired: number;
  ppiMultiplier: number;
  adjustedUnitCostCents: number;
  totalCostCents: number;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PostBidEstimator() {
  const [squareFootage, setSquareFootage] = useState(10000);
  const [surfaceType, setSurfaceType] = useState<SurfaceType>("FINISH");
  const [baseUnitCostCents, setBaseUnitCostCents] = useState(500);
  const [result, setResult] = useState<BomResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      apiFetch<BomResult>("/bom/calculate", {
        method: "POST",
        body: JSON.stringify({ squareFootage, surfaceType, baseUnitCostCents }),
      })
        .then((res) => {
          setResult(res);
          setError(null);
        })
        .catch((err: Error) => setError(err.message));
    }, 250);

    return () => clearTimeout(timeout);
  }, [squareFootage, surfaceType, baseUnitCostCents]);

  return (
    <div className="silas-card">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-cyan">
        Dynamic Post-Bid Estimator
      </h3>

      <div className="space-y-4">
        <label className="block">
          <span className="silas-label">
            Square footage: {squareFootage.toLocaleString()} sq ft
          </span>
          <input
            type="range"
            min={0}
            max={50000}
            step={100}
            value={squareFootage}
            onChange={(e) => setSquareFootage(Number(e.target.value))}
            className="mt-1.5 w-full accent-silas-cyan"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex-1">
            <span className="silas-label">Surface type</span>
            <select
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
              className="silas-input mt-1.5 w-full"
            >
              <option value="FINISH">Finish</option>
              <option value="SCRUB">Scrub</option>
            </select>
          </label>

          <label className="flex-1">
            <span className="silas-label">Base unit cost (¢/gal)</span>
            <input
              type="number"
              min={0}
              value={baseUnitCostCents}
              onChange={(e) => setBaseUnitCostCents(Number(e.target.value))}
              className="silas-input mt-1.5 w-full"
            />
          </label>
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

      {result ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-silas-ink-soft">Yield</dt>
          <dd className="text-silas-ink">{result.yieldSqftPerGallon.toLocaleString()} sqft/gal</dd>

          <dt className="text-silas-ink-soft">Gallons required</dt>
          <dd className="text-silas-ink">{result.gallonsRequired}</dd>

          <dt className="text-silas-ink-soft">PPI multiplier</dt>
          <dd className="text-silas-ink">{result.ppiMultiplier}×</dd>

          <dt className="text-silas-ink-soft">Adjusted unit cost</dt>
          <dd className="text-silas-ink">{formatCents(result.adjustedUnitCostCents)}</dd>

          <dt className="font-semibold text-silas-cyan">Total cost</dt>
          <dd className="font-semibold text-silas-cyan">{formatCents(result.totalCostCents)}</dd>
        </dl>
      ) : null}
    </div>
  );
}
