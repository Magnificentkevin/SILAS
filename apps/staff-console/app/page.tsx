"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, signOut, type StaffUser } from "@/lib/auth";

export default function StaffHome() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // The auth token lives in an httpOnly cookie now — unreadable from
    // here by design, so the cached user record is the local "am I
    // logged in" signal instead (same limitation getToken() had before).
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
          <span className="silas-badge-restricted">Staff only</span>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-silas-ink">
            <Image src="/badge-mark.png" alt="" width={32} height={32} className="rounded-full" />
            SILAS Staff Console
          </h1>
          <p className="mt-1 text-sm text-silas-ink-soft">
            Signed in as {user?.email} · {user?.globalRole}
          </p>
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

      <div className="silas-card max-w-2xl">
        <p className="text-sm text-silas-ink-soft">
          This console is scaffolding — the login flow and route separation from the
          client portal are wired up and enforced by the API&apos;s RolesGuard.
          Internal tooling (patent audit views, invention/claim tracking, operator
          console) gets built out here next.
        </p>
      </div>
    </div>
  );
}
