"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientLogin } from "@/lib/auth";
import { describeError } from "@/lib/api";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await clientLogin(email, password);
      router.push("/");
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <div className="silas-card w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-silas-cyan">
          SILAS Command Portal
        </h1>
        <p className="mt-1 text-sm text-silas-ink-soft">
          Sign in to view your facility&apos;s pipeline, pricing, and live operations.
        </p>

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

          <label className="block">
            <span className="silas-label">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="silas-input mt-1.5 w-full"
            />
          </label>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs">
          <Link href="/forgot-password" className="text-silas-cyan hover:brightness-110">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
