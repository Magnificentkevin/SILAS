"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch, describeError } from "@/lib/api";

interface SubmitBidResponse {
  accepted: boolean;
  accountId: string;
  amountCents: number;
}

function BidForm() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? "";
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<SubmitBidResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const res = await apiFetch<SubmitBidResponse>("/compliance/bids", {
        method: "POST",
        body: JSON.stringify({ accountId, amountCents, description: description || undefined }),
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
      <span className="silas-badge-partner">Vendor</span>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-silas-ink">Submit a bid</h1>
      <p className="mt-1 text-sm text-silas-ink-soft">
        Account <span className="text-silas-ink">{accountId || "(none provided)"}</span>
      </p>

      {result ? (
        <p className="mt-6 text-sm text-silas-cyan">
          Bid of ${(result.amountCents / 100).toFixed(2)} submitted for account {result.accountId}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="silas-label">Bid amount (USD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="silas-input mt-1.5 w-full"
            />
          </label>

          <label className="block">
            <span className="silas-label">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="silas-input mt-1.5 w-full"
              rows={3}
            />
          </label>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={pending || !accountId}
            className="w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit bid"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function BidPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <Suspense fallback={null}>
        <BidForm />
      </Suspense>
    </div>
  );
}
