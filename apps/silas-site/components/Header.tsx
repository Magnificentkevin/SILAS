import Image from "next/image";
import { silasConfig } from "@/lib/site-config";

export function Header() {
  return (
    <header className="border-b border-silas-border/60">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-5">
        <Image
          src="/logo-horizontal.png"
          alt={silasConfig.name}
          width={160}
          height={40}
          priority
        />
        <div className="flex items-center gap-3">
          <a
            href={silasConfig.clientPortalUrl}
            className="rounded-lg border border-silas-border/70 px-4 py-2 text-sm font-medium text-silas-ink-soft transition hover:border-silas-cyan/50 hover:text-silas-ink"
          >
            Client Login
          </a>
          <a
            href={silasConfig.portalUrl}
            className="rounded-lg border border-silas-border/70 px-4 py-2 text-sm font-medium text-silas-ink-soft transition hover:border-silas-cyan/50 hover:text-silas-ink"
          >
            Staff Login
          </a>
        </div>
      </div>
    </header>
  );
}
