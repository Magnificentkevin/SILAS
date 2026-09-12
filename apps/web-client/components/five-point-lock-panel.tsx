"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

interface LockChecks {
  robotSocOk: boolean;
  materialsAllocatedOk: boolean;
  quietHourClearanceOk: boolean;
  subcontractorComplianceOk: boolean;
  escrowPreauthOk: boolean;
}

interface LockResult {
  id: string;
  facilityId: string;
  status: "LOCKED" | "REJECTED";
  checks: LockChecks;
  accessPin?: string;
}

const CHECK_LABELS: Record<keyof LockChecks, string> = {
  robotSocOk: "Autonomous Robot SOC ≥ 85%",
  materialsAllocatedOk: "Closet materials allocated",
  quietHourClearanceOk: "Quiet-hour window clearance",
  subcontractorComplianceOk: "Subcontractor BAA/COI clearance",
  escrowPreauthOk: "Escrow pre-authorization",
};

export function FivePointLockPanel({ accountId }: { accountId: string }) {
  const [robotSocPercent, setRobotSocPercent] = useState(90);
  const [materialsAllocated, setMaterialsAllocated] = useState(true);
  const [quietHourClearance, setQuietHourClearance] = useState(true);
  const [subcontractorCoiOk, setSubcontractorCoiOk] = useState(true);
  const [escrowPreauthOk, setEscrowPreauthOk] = useState(true);

  const [result, setResult] = useState<LockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Tracks the *current* accountId so an in-flight request can tell, once its
  // response arrives, whether the panel has since switched to a different
  // facility -- accountId itself is fixed within a given commitAndLock call's
  // closure, so it can't detect a later switch on its own.
  const accountIdRef = useRef(accountId);
  useEffect(() => {
    accountIdRef.current = accountId;
    // A previous facility's result must never appear to belong to this one.
    setResult(null);
    setError(null);
  }, [accountId]);

  const liveChecks: LockChecks = {
    robotSocOk: robotSocPercent >= 85,
    materialsAllocatedOk: materialsAllocated,
    quietHourClearanceOk: quietHourClearance,
    subcontractorComplianceOk: subcontractorCoiOk,
    escrowPreauthOk: escrowPreauthOk,
  };

  async function commitAndLock() {
    // Snapshot which facility this specific request is for -- accountId may
    // change (the panel switches to a different facility) before the
    // response arrives.
    const requestedAccountId = accountId;
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
      // Stale response for a facility we've since switched away from --
      // applying it now would show facility A's result under facility B.
      if (accountIdRef.current !== requestedAccountId) return;
      setResult(res);
    } catch (err) {
      if (accountIdRef.current !== requestedAccountId) return;
      setError(err instanceof Error ? err.message : "Lock attempt failed");
    } finally {
      if (accountIdRef.current === requestedAccountId) {
        setPending(false);
      }
    }
  }

  return (
    <div className="silas-card">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-cyan">
        5-Point Lock Panel
      </h3>

      <label className="mb-3 block">
        <span className="text-xs text-silas-ink-soft">Robot SOC: {robotSocPercent}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={robotSocPercent}
          onChange={(e) => setRobotSocPercent(Number(e.target.value))}
          className="mt-1 w-full accent-silas-cyan"
        />
      </label>

      <ul className="space-y-2">
        <ChecklistItem
          label={CHECK_LABELS.robotSocOk}
          checked={liveChecks.robotSocOk}
          readOnly
        />
        <ChecklistItem
          label={CHECK_LABELS.materialsAllocatedOk}
          checked={materialsAllocated}
          onChange={setMaterialsAllocated}
        />
        <ChecklistItem
          label={CHECK_LABELS.quietHourClearanceOk}
          checked={quietHourClearance}
          onChange={setQuietHourClearance}
        />
        <ChecklistItem
          label={CHECK_LABELS.subcontractorComplianceOk}
          checked={subcontractorCoiOk}
          onChange={setSubcontractorCoiOk}
        />
        <ChecklistItem
          label={CHECK_LABELS.escrowPreauthOk}
          checked={escrowPreauthOk}
          onChange={setEscrowPreauthOk}
        />
      </ul>

      <button
        type="button"
        onClick={commitAndLock}
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Committing…" : "Commit & Lock"}
      </button>

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

      {result ? (
        <div className="mt-3 rounded-lg border border-silas-border/40 bg-silas-navy-soft/50 p-3 text-sm">
          <p className="text-xs text-silas-ink-soft">
            Facility: <span className="font-mono">{result.facilityId}</span>
          </p>
          <p className={result.status === "LOCKED" ? "text-silas-cyan" : "text-red-400"}>
            {result.status}
          </p>
          {result.accessPin ? (
            <p className="mt-1 text-silas-ink">
              Access PIN: <span className="font-mono">{result.accessPin}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ChecklistItem({
  label,
  checked,
  onChange,
  readOnly,
}: {
  label: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <li className="silas-row flex items-center justify-between">
      <span className="text-silas-ink">{label}</span>
      {readOnly ? (
        <span className={checked ? "text-silas-cyan" : "text-red-400"}>
          {checked ? "PASS" : "FAIL"}
        </span>
      ) : (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="accent-silas-cyan"
        />
      )}
    </li>
  );
}
