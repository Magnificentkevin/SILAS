import { silasConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-silas-border/60">
      <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-silas-ink-soft/70">
        &copy; {new Date().getFullYear()} {silasConfig.name}
      </div>
    </footer>
  );
}
