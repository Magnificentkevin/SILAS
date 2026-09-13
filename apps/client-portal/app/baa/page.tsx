"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch, describeError } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

interface BaaTerms {
  version: string;
  text: string;
}

function BaaForm() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? "";
  const storedUser = getStoredUser();
  const [terms, setTerms] = useState<BaaTerms | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    apiFetch<BaaTerms>("/compliance/baa/terms")
      .then(setTerms)
      .catch((err) => setTermsError(describeError(err)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiFetch("/compliance/baa/accept", {
        method: "POST",
        body: JSON.stringify({ accountId }),
      });
      setAccepted(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="silas-card w-full max-w-md">
      <span className="silas-badge-partner">Customer</span>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-silas-ink">
        Accept Business Associate Agreement
      </h1>
      <p className="mt-1 text-sm text-silas-ink-soft">
        Account <span className="text-silas-ink">{accountId || "(none provided)"}</span>
      </p>

      {accepted ? (
        <p className="mt-6 text-sm text-silas-cyan">
          BAA acceptance recorded for this account ({terms?.version}).
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {termsError ? (
            <p className="text-xs text-red-400">Could not load terms: {termsError}</p>
          ) : terms ? (
            <div>
              <span className="silas-label">Terms ({terms.version})</span>
              <pre className="silas-input mt-1.5 max-h-64 w-full overflow-y-auto whitespace-pre-wrap text-xs">
                {terms.text}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-silas-ink-soft">Loading terms…</p>
          )}

          <label className="flex items-start gap-2 text-xs text-silas-ink-soft">
            <input
              type="checkbox"
              checked={hasReviewed}
              onChange={(e) => setHasReviewed(e.target.checked)}
              disabled={!terms}
              className="mt-0.5"
            />
            I have read and agree to the terms above.
          </label>

          <p className="text-xs text-silas-ink-soft">
            Accepting as <span className="text-silas-ink">{storedUser?.email ?? "(unknown user)"}</span>
          </p>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={pending || !accountId || !hasReviewed}
            className="w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Accept BAA"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function BaaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <Suspense fallback={null}>
        <BaaForm />
      </Suspense>
    </div>
  );
}
