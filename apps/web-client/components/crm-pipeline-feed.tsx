"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Account {
  id: string;
  name: string;
  isHealthcareSite: boolean;
  healthScore: number;
}

interface Opportunity {
  id: string;
  accountId: string;
  stage: string;
  account: Account;
  updatedAt: string;
}

interface Run {
  id: string;
  accountId: string;
  status: string;
  createdAt: string;
  account: Account;
}

const POLL_INTERVAL_MS = 5000;

function healthColor(score: number) {
  if (score >= 70) return "text-silas-cyan";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

export function CrmPipelineFeed() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [accountsRes, opportunitiesRes, runsRes] = await Promise.all([
        apiFetch<Account[]>("/crm/accounts"),
        apiFetch<Opportunity[]>("/crm/opportunities"),
        apiFetch<Run[]>("/crm/runs"),
      ]);
      if (!cancelled) {
        setAccounts(accountsRes);
        setOpportunities(opportunitiesRes);
        setRuns(runsRes);
      }
    }

    load().catch(() => undefined);
    const interval = setInterval(() => load().catch(() => undefined), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="silas-card">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-cyan">
        CRM Pipeline &amp; Feed
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section>
          <h4 className="silas-eyebrow mb-2">Account health</h4>
          <ul className="space-y-1.5">
            {accounts.slice(0, 6).map((account) => (
              <li key={account.id} className="silas-row flex items-center justify-between">
                <span className="truncate text-silas-ink">{account.name}</span>
                <span className={`font-semibold ${healthColor(account.healthScore)}`}>
                  {account.healthScore}
                </span>
              </li>
            ))}
            {accounts.length === 0 ? <li className="text-xs text-silas-ink-soft">No accounts yet</li> : null}
          </ul>
        </section>

        <section>
          <h4 className="silas-eyebrow mb-2">Opportunities</h4>
          <ul className="space-y-1.5">
            {opportunities.slice(0, 6).map((opp) => (
              <li key={opp.id} className="silas-row">
                <div className="truncate text-silas-ink">{opp.account.name}</div>
                <div className="text-xs text-silas-cyan">{opp.stage}</div>
              </li>
            ))}
            {opportunities.length === 0 ? (
              <li className="text-xs text-silas-ink-soft">No opportunities yet</li>
            ) : null}
          </ul>
        </section>

        <section>
          <h4 className="silas-eyebrow mb-2">Live activity</h4>
          <ul className="space-y-1.5">
            {runs.slice(0, 6).map((run) => (
              <li key={run.id} className="silas-row">
                <div className="truncate text-silas-ink">{run.account.name}</div>
                <div className="text-xs text-silas-ink-soft">
                  {run.status} · {new Date(run.createdAt).toLocaleTimeString()}
                </div>
              </li>
            ))}
            {runs.length === 0 ? <li className="text-xs text-silas-ink-soft">No activity yet</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
