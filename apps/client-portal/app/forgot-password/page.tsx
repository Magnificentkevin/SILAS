"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch, describeError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email, app: "client-portal" }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <div className="silas-card w-full max-w-sm">
        <span className="silas-badge-partner">Client portal</span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-silas-ink">
          Reset your password
        </h1>

        {submitted ? (
          <p className="mt-4 text-sm text-silas-ink-soft">
            If an account exists for that email, we&apos;ve sent a link to reset your password.
            Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="silas-label">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="silas-input mt-1.5 w-full"
              />
            </label>

            {error ? <p className="text-xs text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-silas-ink-soft">
          <Link href="/login" className="text-silas-cyan hover:brightness-110">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
