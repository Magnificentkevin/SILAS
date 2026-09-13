import Image from "next/image";
import { silasConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
        <Image
          src="/badge-hero.png"
          alt=""
          width={100}
          height={100}
          className="mx-auto"
          priority
        />
        <p className="silas-eyebrow mt-6 text-xs font-medium tracking-wide text-silas-ink-soft/80 uppercase">
          Enterprise orchestration
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-silas-ink">
          {silasConfig.tagline}
        </h1>
        <p className="mt-3 text-base sm:text-lg font-medium text-silas-royal">
          {silasConfig.capabilityLine}
        </p>
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

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2">
          <Image
            src="/office-1.jpg"
            alt=""
            width={900}
            height={1200}
            className="rounded-2xl object-cover shadow-sm"
            style={{ aspectRatio: "3 / 4", maxHeight: "320px", width: "100%" }}
          />
          <Image
            src="/office-2.jpg"
            alt=""
            width={900}
            height={1200}
            className="rounded-2xl object-cover shadow-sm"
            style={{ aspectRatio: "3 / 4", maxHeight: "320px", width: "100%" }}
          />
        </div>
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
