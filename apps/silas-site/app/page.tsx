import { silasConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
        <p className="silas-eyebrow text-xs font-medium tracking-wide text-silas-ink-soft/80 uppercase">
          Enterprise orchestration
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-silas-ink">
          {silasConfig.tagline}
        </h1>
        <p className="mt-6 text-lg text-silas-ink-soft max-w-2xl mx-auto">
          {silasConfig.heroSubhead}
        </p>
        <a
          href={silasConfig.portalUrl}
          className="mt-8 inline-block rounded-lg bg-silas-cyan px-6 py-3 text-sm font-semibold text-silas-void hover:opacity-90 transition-opacity"
        >
          Staff Login
        </a>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          {silasConfig.features.map((feature) => (
            <div key={feature.title} className="silas-card">
              <h2 className="text-sm font-semibold tracking-wide text-silas-cyan">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-silas-ink-soft">{feature.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-silas-ink-soft/80">
          Proven in production coordinating a real commercial cleaning operation —
          SILAS&apos;s first real-world deployment.
        </p>
      </section>
    </>
  );
}
