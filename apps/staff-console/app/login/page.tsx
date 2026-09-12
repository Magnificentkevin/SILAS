"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { staffLogin } from "@/lib/auth";

export default function StaffLoginPage() {
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
      await staffLogin(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <div className="silas-card w-full max-w-sm">
        <span className="silas-badge-restricted">Staff only</span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-silas-ink">
          SILAS Staff Console
        </h1>
        <p className="mt-1 text-sm text-silas-ink-soft">
          Internal access for operators, verifiers, and administrators.
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

        <p className="mt-6 text-center text-xs text-silas-ink-soft">
          Looking for the client portal instead? Visit{" "}
          <span className="text-silas-cyan">clients.silaserv.com</span>.
        </p>
      </div>
    </div>
  );
}
