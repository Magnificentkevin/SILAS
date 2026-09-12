import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <main className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-medium tracking-widest text-algo-accent uppercase">
          Coming Soon
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-algo-ink">{siteConfig.name}</h1>
        <p className="mt-3 text-sm text-algo-ink-soft">{siteConfig.tagline}</p>

        <a
          href={siteConfig.ctaHref}
          className="mt-8 inline-block rounded-xl border border-algo-border bg-algo-surface px-6 py-3 text-sm font-medium text-algo-ink transition-colors hover:border-algo-accent/60"
        >
          {siteConfig.ctaLabel}
        </a>
      </div>
    </main>
  );
}
