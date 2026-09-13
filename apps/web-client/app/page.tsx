"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CrmPipelineFeed } from "@/components/crm-pipeline-feed";
import { DigitalTwinViewer } from "@/components/digital-twin-viewer";
import { FivePointLockPanel } from "@/components/five-point-lock-panel";
import { PostBidEstimator } from "@/components/post-bid-estimator";
import { apiFetch } from "@/lib/api";
import { getStoredUser, signOut, type ClientUser } from "@/lib/auth";

interface Account {
  id: string;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [facilityId, setFacilityId] = useState("");

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

  useEffect(() => {
    if (!checked) return;
    apiFetch<Account[]>("/crm/accounts")
      .then((accounts) => {
        if (accounts[0]) setFacilityId(accounts[0].id);
      })
      .catch(() => undefined);
  }, [checked]);

  if (!checked) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen p-8 text-silas-ink">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-silas-cyan">
            <Image src="/badge-mark.png" alt="" width={32} height={32} className="rounded-full" />
            SILAS Command Portal
          </h1>
          <p className="mt-1 text-sm text-silas-ink-soft">
            Signed in as {user?.email} · {user?.globalRole}
          </p>
          <label className="mt-4 block max-w-md">
            <span className="silas-label">Active facility (account ID)</span>
            <input
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              placeholder="Paste an account id from the CRM feed"
              className="silas-input mt-1.5 w-full"
            />
          </label>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {facilityId ? (
          <DigitalTwinViewer facilityId={facilityId} />
        ) : (
          <div className="silas-empty">
            Enter a facility (account) ID above to mount the Digital Twin Viewer.
          </div>
        )}

        {facilityId ? (
          <FivePointLockPanel accountId={facilityId} />
        ) : (
          <div className="silas-empty">
            Enter a facility (account) ID above to enable the lock panel.
          </div>
        )}

        <PostBidEstimator />

        <CrmPipelineFeed />
      </div>
    </div>
  );
}
