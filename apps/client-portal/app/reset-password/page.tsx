"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch, describeError } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="silas-card w-full max-w-sm">
      <span className="silas-badge-partner">Client portal</span>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-silas-ink">
        Choose a new password
      </h1>

      {done ? (
        <p className="mt-4 text-sm text-silas-cyan">
          Your password has been reset.{" "}
          <Link href="/login" className="underline hover:brightness-110">
            Sign in
          </Link>
          .
        </p>
      ) : !token ? (
        <p className="mt-4 text-xs text-red-400">
          This link is missing its reset token. Request a new one from the{" "}
          <Link href="/forgot-password" className="text-silas-cyan underline">
            forgot password
          </Link>{" "}
          page.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="silas-label">New password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="silas-input mt-1.5 w-full"
            />
          </label>

          <label className="block">
            <span className="silas-label">Confirm new password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="silas-input mt-1.5 w-full"
            />
          </label>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-silas-cyan px-3 py-2.5 text-sm font-semibold text-silas-void transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Reset password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-silas-ink">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
