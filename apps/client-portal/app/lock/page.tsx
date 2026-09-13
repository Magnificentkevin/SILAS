"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch, describeError } from "@/lib/api";

interface LockResult {
  [key: string]: unknown;
}

function LockForm() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? "";
  const [robotSocPercent, setRobotSocPercent] = useState(100);
  const [materialsAllocated, setMaterialsAllocated] = useState(false);
  const [quietHourClearance, setQuietHourClearance] = useState(false);
  const [subcontractorCoiOk, setSubcontractorCoiOk] = useState(false);
  const [escrowPreauthOk, setEscrowPreauthOk] = useState(false);
  const [result, setResult] = useState<LockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch<LockResult>("/scheduling/locks", {
        method: "POST",
        body: JSON.stringify({
          accountId,
          robotSocPercent,
          materialsAllocated,
          quietHourClearance,
          subcontractorCoiOk,
          escrowPreauthOk,
        }),
      });
      setResult(res);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="silas-card w-full max-w-md">
      <span className="silas-badge-partner">Host client</span>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-silas-ink">
        Attempt five-point lock
      </h1>
      <p className="mt-1 text-sm text-silas-ink-soft">
        Facility <span className="text-silas-ink">{accountId || "(none provided)"}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="silas-label">Robot state of charge (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            required
            value={robotSocPercent}
            onChange={(e) => setRobotSocPercent(Number(e.target.value))}
            className="silas-input mt-1.5 w-full"
          />
        </label>

        {[
          ["Materials allocated", materialsAllocated, setMaterialsAllocated],
          ["Quiet-hour clearance", quietHourClearance, setQuietHourClearance],
          ["Subcontractor COI ok", subcontractorCoiOk, setSubcontractorCoiOk],
          ["Escrow pre-auth ok", escrowPreauthOk, setEscrowPreauthOk],
        ].map(([label, value, setValue]) => (
          <label key={label as string} className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => (setValue as (v: boolean) => void)(e.target.checked)}
              className="h-4 w-4 rounded border-silas-border/70 bg-silas-navy-soft accent-silas-cyan"
            />
            <span className="text-sm text-silas-ink-soft">{label as string}</span>
          </label>
        ))}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        {result ? (
          <pre className="overflow-x-auto rounded-lg border border-silas-border/70 bg-silas-navy-soft p-3 text-xs text-silas-ink">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}

        <button
          type="submit"
          disabled={pending || !accountId}
          className="w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Attempt lock"}
        </button>
      </form>
    </div>
  );
}

export default function LockPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <Suspense fallback={null}>
        <LockForm />
      </Suspense>
    </div>
  );
}
