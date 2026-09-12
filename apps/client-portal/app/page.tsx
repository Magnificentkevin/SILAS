"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, signOut, type ClientUser, type MembershipRole } from "@/lib/auth";

const ACTION_BY_ROLE: Record<MembershipRole, { label: string; description: string; href: (accountId: string) => string }> = {
  VENDOR: {
    label: "Submit a bid",
    description: "Bid on work at this account.",
    href: (accountId) => `/bid?accountId=${accountId}`,
  },
  CUSTOMER: {
    label: "Accept BAA",
    description: "Accept the Business Associate Agreement for this account.",
    href: (accountId) => `/baa?accountId=${accountId}`,
  },
  HOST_CLIENT: {
    label: "Attempt five-point lock",
    description: "Run the five-point lock check for this facility.",
    href: (accountId) => `/lock?accountId=${accountId}`,
  },
};

export default function ClientHome() {
  const router = useRouter();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // The auth token itself lives in an httpOnly cookie now — unreadable
    // from here by design, so the cached user record is the local signal
    // for "is someone logged in" (same limitation getToken() had before:
    // neither one confirms the server still considers the session valid).
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setChecked(true);
  }, [router]);

  if (!checked) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen p-8 text-silas-ink">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <span className="silas-badge-partner">Client portal</span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-silas-ink">
            SILAS Client Portal
          </h1>
          <p className="mt-1 text-sm text-silas-ink-soft">Signed in as {user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
          className="rounded-lg border border-silas-border/70 px-3 py-2 text-sm text-silas-ink-soft transition hover:border-silas-cyan/40 hover:text-silas-ink"
        >
          Sign out
        </button>
      </header>

      {user && user.memberships.length === 0 ? (
        <div className="silas-card max-w-2xl">
          <p className="text-sm text-silas-ink-soft">
            No accounts are linked to this login yet.
          </p>
        </div>
      ) : null}

      <div className="grid max-w-2xl gap-4">
        {user?.memberships.map((membership) => {
          const action = ACTION_BY_ROLE[membership.role];
          return (
            <div key={`${membership.accountId}-${membership.role}`} className="silas-card">
              <span className="silas-badge-partner">{membership.role}</span>
              <p className="mt-2 text-xs text-silas-ink-soft">
                Account <span className="text-silas-ink">{membership.accountId}</span>
              </p>
              <p className="mt-3 text-sm text-silas-ink-soft">{action.description}</p>
              <Link
                href={action.href(membership.accountId)}
                className="mt-4 inline-block rounded-lg bg-silas-cyan px-3 py-2 text-sm font-semibold text-silas-void transition hover:brightness-110"
              >
                {action.label}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
